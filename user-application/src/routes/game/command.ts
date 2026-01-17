import type { CommandRequest, CommandResponse } from "@repo/shared";
import type { Context } from "hono";
import { resolvePuzzleId } from "./game-service";

export async function commandHandler(
  c: Context<{
    Bindings: Cloudflare.Env;
    Variables: { userId: string };
  }>,
) {
  const userId = c.get("userId");
  const body = await c.req.json<CommandRequest>();
  const { gameId, command } = body;

  try {
    // First try to get the stored puzzle ID for consistency
    const userGameKey = `user_game:${userId}:${gameId}`;
    let puzzleId = await c.env.KV.get(userGameKey);
    let error: string | undefined;

    // Fallback to resolution if not found
    if (!puzzleId) {
      const resolved = await resolvePuzzleId(gameId, c.env.KV);
      puzzleId = resolved.puzzleId;
      error = resolved.error;
    }

    if (!puzzleId || error) {
      return c.json<CommandResponse>(
        {
          success: false,
          error: error || "Puzzle not found",
        },
        404,
      );
    }

    const response = await c.env.DATA_SERVICE.fetch(
      new Request("http://internal/game/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          puzzleId,
          command,
        }),
      }),
    );

    const result = (await response.json()) as CommandResponse;
    return c.json(result);
  } catch (error) {
    console.error("Command error:", error);
    return c.json<CommandResponse>(
      {
        success: false,
        error: "Failed to execute command",
      },
      500,
    );
  }
}
