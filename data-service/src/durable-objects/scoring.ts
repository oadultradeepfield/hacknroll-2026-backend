import type { GameRewards, GameState, Puzzle } from "@repo/shared";
import { SCORING } from "@repo/shared";

export function calculateRewards(
  puzzle: Puzzle,
  gameState: GameState,
): GameRewards {
  const commandsUsed = gameState.commandHistory.length;
  const { parScore } = puzzle;
  const diff = commandsUsed - parScore;

  const [performance, bonusPoints]: [
    "under_par" | "at_par" | "over_par",
    number,
  ] =
    diff < 0
      ? ["under_par", -diff * SCORING.UNDER_PAR_BONUS_PER_COMMAND]
      : diff === 0
        ? ["at_par", SCORING.AT_PAR_BONUS]
        : [
            "over_par",
            -Math.min(
              diff * SCORING.OVER_PAR_PENALTY_PER_COMMAND,
              SCORING.BASE_COMPLETION / 2,
            ),
          ];

  return {
    score: Math.max(0, SCORING.BASE_COMPLETION + bonusPoints),
    parScore,
    commandsUsed,
    optimalSolution: puzzle.solution,
    performance,
    bonusPoints,
  };
}
