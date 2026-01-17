import {
  completeGame,
  createGame,
  getPuzzleById,
  initDatabase,
  updateGameCommands,
} from "@repo/database";
import { GitEngine } from "@repo/git-engine";
import type {
  Command,
  CommandResponse,
  FileTarget,
  GameRewards,
  GameState,
  GameStateSnapshot,
  Puzzle,
  PuzzleConstraints,
  StartGameResponse,
} from "@repo/shared";
import {
  DAILY_PUZZLE_KEY_PREFIX,
  MAX_UNDO_STACK_SIZE,
  SCORING,
  STALE_SESSION_HOURS,
} from "@repo/shared";
import { nanoid } from "nanoid";

interface SessionData {
  userId: string;
  puzzleId: string;
  gameId: string;
  gameState: GameState;
  puzzle: Puzzle;
}

export class GameSession implements DurableObject {
  private state: DurableObjectState;
  private env: Cloudflare.Env;
  private sessionData: SessionData | null = null;
  private engine: GitEngine | null = null;

  constructor(state: DurableObjectState, env: Cloudflare.Env) {
    this.state = state;
    this.env = env;
    initDatabase(env.DB);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/start") {
        return await this.handleStart(request);
      } else if (url.pathname === "/command") {
        return await this.handleCommand(request);
      }

      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("GameSession error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Internal error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  private async handleStart(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      userId: string;
      puzzleId: string;
      existingGameId?: string;
    };

    const { userId, puzzleId, existingGameId } = body;

    await this.loadSession();

    if (this.sessionData) {
      const response: StartGameResponse = {
        success: true,
        gameState: this.sessionData.gameState,
        puzzle: this.sessionData.puzzle,
        isCompleted: this.sessionData.gameState.status === "completed",
      };

      if (response.isCompleted) {
        response.rewards = this.calculateRewards();
      }

      return this.jsonResponse(response);
    }

    const puzzle = await this.loadPuzzle(puzzleId);
    if (!puzzle) {
      return this.jsonResponse({
        success: false,
        error: "Puzzle not found",
      } as StartGameResponse);
    }

    const gameId = existingGameId || `game_${nanoid(16)}`;
    const initialState = this.createInitialGameState(puzzle);

    if (!existingGameId) {
      await createGame({
        id: gameId,
        userId,
        puzzleId,
        status: "in_progress",
        commandsUsed: 0,
        score: null,
        startedAt: Date.now(),
        completedAt: null,
      });
    }

    this.sessionData = {
      userId,
      puzzleId,
      gameId,
      gameState: initialState,
      puzzle,
    };

    this.engine = new GitEngine(
      initialState.graph,
      puzzle.fileTargets as FileTarget[],
      puzzle.constraints as PuzzleConstraints,
    );

    await this.saveSession();

    await this.state.storage.setAlarm(
      Date.now() + STALE_SESSION_HOURS * 60 * 60 * 1000,
    );

    return this.jsonResponse({
      success: true,
      gameState: initialState,
      puzzle,
    } as StartGameResponse);
  }

  private async handleCommand(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      userId: string;
      puzzleId: string;
      command: Command;
    };

    const { command } = body;

    await this.loadSession();

    if (!this.sessionData || !this.engine) {
      return this.jsonResponse({
        success: false,
        error: "No active game session",
      } as CommandResponse);
    }

    if (this.sessionData.gameState.status === "completed") {
      return this.jsonResponse({
        success: false,
        error: "Game is already completed",
        isCompleted: true,
        rewards: this.calculateRewards(),
      } as CommandResponse);
    }

    if (command.type === "undo") {
      return await this.handleUndo();
    }

    const snapshot = this.createSnapshot();
    const result = this.engine.executeCommand(command);

    if (!result.success) {
      return this.jsonResponse({
        success: false,
        error: result.error,
      } as CommandResponse);
    }

    if (result.newGraph) {
      this.sessionData.gameState.graph = result.newGraph;
    }
    if (result.collectedFiles) {
      this.sessionData.gameState.collectedFiles = result.collectedFiles;
    }
    this.sessionData.gameState.commandHistory.push(command);
    this.sessionData.gameState.lastActivityAt = Date.now();

    if (this.sessionData.gameState.undoStack.length >= MAX_UNDO_STACK_SIZE) {
      this.sessionData.gameState.undoStack.shift();
    }
    this.sessionData.gameState.undoStack.push(snapshot);

    if (result.isGameComplete) {
      this.sessionData.gameState.status = "completed";

      const rewards = this.calculateRewards();

      await completeGame(
        this.sessionData.gameId,
        this.sessionData.userId,
        rewards.score,
        rewards.commandsUsed,
      );

      await this.saveSession();

      return this.jsonResponse({
        success: true,
        gameState: this.sessionData.gameState,
        isCompleted: true,
        rewards,
      } as CommandResponse);
    }

    await this.saveSession();

    await updateGameCommands(
      this.sessionData.gameId,
      this.sessionData.gameState.commandHistory.length,
    );

    return this.jsonResponse({
      success: true,
      gameState: this.sessionData.gameState,
    } as CommandResponse);
  }

  private async handleUndo(): Promise<Response> {
    if (!this.sessionData) {
      return this.jsonResponse({
        success: false,
        error: "No active session",
      } as CommandResponse);
    }

    if (this.sessionData.gameState.undoStack.length === 0) {
      return this.jsonResponse({
        success: false,
        error: "Nothing to undo",
      } as CommandResponse);
    }

    const previousState = this.sessionData.gameState.undoStack.pop();

    if (!previousState) {
      return this.jsonResponse({
        success: false,
        error: "Failed to restore previous state",
      } as CommandResponse);
    }

    this.sessionData.gameState.graph = previousState.graph;
    this.sessionData.gameState.collectedFiles = previousState.collectedFiles;
    this.sessionData.gameState.commandHistory = previousState.commandHistory;
    this.sessionData.gameState.lastActivityAt = Date.now();

    this.engine = new GitEngine(
      previousState.graph,
      this.sessionData.puzzle.fileTargets as FileTarget[],
      this.sessionData.puzzle.constraints as PuzzleConstraints,
    );

    await this.saveSession();

    return this.jsonResponse({
      success: true,
      gameState: this.sessionData.gameState,
    } as CommandResponse);
  }

  async alarm(): Promise<void> {
    await this.loadSession();

    if (!this.sessionData) return;

    const now = Date.now();
    const lastActivity = this.sessionData.gameState.lastActivityAt;
    const hoursInactive = (now - lastActivity) / (1000 * 60 * 60);

    if (hoursInactive >= STALE_SESSION_HOURS) {
      if (this.sessionData.gameState.status === "in_progress") {
        await this.saveSession();
      }

      await this.state.storage.deleteAll();
    } else {
      await this.state.storage.setAlarm(
        now + (STALE_SESSION_HOURS - hoursInactive) * 60 * 60 * 1000,
      );
    }
  }

  private async loadSession(): Promise<void> {
    if (this.sessionData) return;

    const stored = await this.state.storage.get<SessionData>("session");
    if (stored) {
      this.sessionData = stored;
      this.engine = new GitEngine(
        stored.gameState.graph,
        stored.puzzle.fileTargets as FileTarget[],
        stored.puzzle.constraints as PuzzleConstraints,
      );
    }
  }

  private async saveSession(): Promise<void> {
    if (this.sessionData) {
      await this.state.storage.put("session", this.sessionData);
    }
  }

  private async loadPuzzle(puzzleId: string): Promise<Puzzle | null> {
    const today = new Date().toISOString().split("T")[0];
    const kvKey = `${DAILY_PUZZLE_KEY_PREFIX}${today}`;
    const cached = await this.env.KV.get(kvKey, "json");

    if (cached && (cached as Puzzle).id === puzzleId) {
      return cached as Puzzle;
    }

    const puzzle = await getPuzzleById(puzzleId);

    if (!puzzle) return null;

    return {
      id: puzzle.id,
      date: puzzle.date,
      difficultyLevel: puzzle.difficultyLevel,
      fileTargets: puzzle.fileTargets as FileTarget[],
      constraints: puzzle.constraints as PuzzleConstraints,
      solution: puzzle.solution,
      parScore: puzzle.parScore,
    };
  }

  private createInitialGameState(_puzzle: Puzzle): GameState {
    const initialGraph = GitEngine.createInitialGraph();

    return {
      graph: initialGraph,
      collectedFiles: [],
      commandHistory: [],
      undoStack: [],
      status: "in_progress",
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
    };
  }

  private createSnapshot(): GameStateSnapshot {
    if (!this.sessionData) {
      throw new Error("Cannot create snapshot without session data");
    }

    return {
      graph: JSON.parse(JSON.stringify(this.sessionData.gameState.graph)),
      collectedFiles: [...this.sessionData.gameState.collectedFiles],
      commandHistory: [...this.sessionData.gameState.commandHistory],
    };
  }

  private calculateRewards(): GameRewards {
    if (!this.sessionData) {
      return {
        score: 0,
        parScore: 0,
        commandsUsed: 0,
        optimalSolution: { commands: [], totalCommands: 0 },
        performance: "over_par",
        bonusPoints: 0,
      };
    }

    const { puzzle, gameState } = this.sessionData;
    const commandsUsed = gameState.commandHistory.length;
    const parScore = puzzle.parScore;

    let performance: "under_par" | "at_par" | "over_par";
    let bonusPoints = 0;

    if (commandsUsed < parScore) {
      performance = "under_par";
      bonusPoints =
        (parScore - commandsUsed) * SCORING.UNDER_PAR_BONUS_PER_COMMAND;
    } else if (commandsUsed === parScore) {
      performance = "at_par";
      bonusPoints = SCORING.AT_PAR_BONUS;
    } else {
      performance = "over_par";
      bonusPoints = -Math.min(
        (commandsUsed - parScore) * SCORING.OVER_PAR_PENALTY_PER_COMMAND,
        SCORING.BASE_COMPLETION / 2,
      );
    }

    const score = Math.max(0, SCORING.BASE_COMPLETION + bonusPoints);

    return {
      score,
      parScore,
      commandsUsed,
      optimalSolution: puzzle.solution,
      performance,
      bonusPoints,
    };
  }

  private jsonResponse(data: unknown): Response {
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
