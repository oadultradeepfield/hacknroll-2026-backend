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
    const { puzzleId, error } = await resolvePuzzleId(gameId, c.env.KV);

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
