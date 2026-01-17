import {
  completeGame,
  createGame,
  initDatabase,
  updateGameCommands,
} from "@repo/database";
import type { GitEngine } from "@repo/git-engine";
import type { Command } from "@repo/shared";
import { MAX_UNDO_STACK_SIZE, STALE_SESSION_HOURS } from "@repo/shared";
import { nanoid } from "nanoid";
import { loadPuzzle } from "./data-loader";
import { calculateRewards } from "./scoring";
// Local imports
import type { SessionData } from "./types";
import {
  createEngine,
  createInitialGameState,
  createSnapshot,
  json,
} from "./utils";

// ─── Durable Object ──────────────────────────────────────────────────────────

export class GameSession implements DurableObject {
  private session: SessionData | null = null;
  private engine: GitEngine | null = null;

  constructor(
    private ctx: DurableObjectState,
    private env: Cloudflare.Env,
  ) {
    initDatabase(env.DB);
    ctx.blockConcurrencyWhile(async () => {
      this.session = (await ctx.storage.get<SessionData>("session")) ?? null;
      if (this.session)
        this.engine = createEngine(
          this.session.puzzle,
          this.session.gameState.graph,
        );
    });
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    try {
      if (path === "/start") return this.handleStart(request);
      if (path === "/command") return this.handleCommand(request);
      return new Response("Not found", { status: 404 });
    } catch (e) {
      console.error("GameSession error:", e);
      return json({ success: false, error: "Internal error" }, 500);
    }
  }

  private async handleStart(request: Request): Promise<Response> {
    const { userId, puzzleId, requestedGameId } = await request.json<{
      userId: string;
      puzzleId: string;
      requestedGameId?: string;
    }>();

    if (this.session) {
      const isCompleted = this.session.gameState.status === "completed";
      return json({
        success: true,
        gameState: this.session.gameState,
        puzzle: this.session.puzzle,
        isCompleted,
        ...(isCompleted && {
          rewards: calculateRewards(
            this.session.puzzle,
            this.session.gameState,
          ),
        }),
      });
    }

    const puzzle = await loadPuzzle(this.env.KV, puzzleId);
    if (!puzzle) return json({ success: false, error: "Puzzle not found" });

    const gameId = requestedGameId || `game_${nanoid(16)}`;
    const gameState = createInitialGameState();

    if (!requestedGameId) {
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

    this.session = { userId, puzzleId, gameId, gameState, puzzle };
    this.engine = createEngine(puzzle, gameState.graph);
    await this.save();
    await this.ctx.storage.setAlarm(Date.now() + STALE_SESSION_HOURS * 3600000);

    return json({ success: true, gameState, puzzle });
  }

  private async handleCommand(request: Request): Promise<Response> {
    const { command } = await request.json<{ command: Command }>();

    if (!this.session || !this.engine) {
      return json({ success: false, error: "No active game session" });
    }

    const { puzzle, gameState: gs } = this.session;

    if (gs.status === "completed") {
      return json({
        success: false,
        error: "Game is already completed",
        isCompleted: true,
        rewards: calculateRewards(puzzle, gs),
      });
    }

    if (command.type === "undo") {
      if (!gs.undoStack.length)
        return json({ success: false, error: "Nothing to undo" });

      // biome-ignore lint/style/noNonNullAssertion: undoStack is guaranteed to have at least one element due to the length check above
      const prev = gs.undoStack.pop()!;
      Object.assign(gs, {
        graph: prev.graph,
        collectedFiles: prev.collectedFiles,
        commandHistory: prev.commandHistory,
        lastActivityAt: Date.now(),
      });
      this.engine = createEngine(puzzle, gs.graph);
      await this.save();
      return json({ success: true, gameState: gs });
    }

    const snapshot = createSnapshot(gs);
    const result = this.engine.executeCommand(command);

    if (!result.success) return json({ success: false, error: result.error });

    if (result.newGraph) gs.graph = result.newGraph;
    if (result.collectedFiles) gs.collectedFiles = result.collectedFiles;
    gs.commandHistory.push(command);
    gs.lastActivityAt = Date.now();
    if (gs.undoStack.length >= MAX_UNDO_STACK_SIZE) gs.undoStack.shift();
    gs.undoStack.push(snapshot);

    if (result.isGameComplete) {
      gs.status = "completed";
      const rewards = calculateRewards(puzzle, gs);
      await completeGame(
        this.session.gameId,
        this.session.userId,
        rewards.score,
        rewards.commandsUsed,
      );
      await this.save();
      return json({ success: true, gameState: gs, isCompleted: true, rewards });
    }

    await this.save();
    await updateGameCommands(this.session.gameId, gs.commandHistory.length);
    return json({ success: true, gameState: gs });
  }

  async alarm(): Promise<void> {
    if (!this.session) return;
    const hoursInactive =
      (Date.now() - this.session.gameState.lastActivityAt) / 3600000;

    if (hoursInactive >= STALE_SESSION_HOURS) {
      await this.ctx.storage.deleteAll();
      this.session = null;
      this.engine = null;
    } else {
      await this.ctx.storage.setAlarm(
        Date.now() + (STALE_SESSION_HOURS - hoursInactive) * 3600000,
      );
    }
  }

  private save = () => this.ctx.storage.put("session", this.session);
}
