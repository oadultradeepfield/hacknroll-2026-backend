import type { StartGameRequest, StartGameResponse } from "@repo/shared";
import type { Context } from "hono";
import { resolvePuzzleId } from "./game-service";

export async function startGameHandler(
  c: Context<{
    Bindings: Cloudflare.Env;
    Variables: { userId: string };
  }>,
) {
  const userId = c.get("userId");
  const body = await c.req.json<StartGameRequest>();
  const { gameId: requestedGameId } = body;

  try {
    const { puzzleId, error } = await resolvePuzzleId(
      requestedGameId,
      c.env.KV,
    );

    if (!puzzleId || error) {
      return c.json<StartGameResponse>(
        {
          success: false,
          error: error || "Failed to resolve puzzle",
        },
        404,
      );
    }

    const response = await c.env.DATA_SERVICE.fetch(
      new Request("http://internal/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          puzzleId,
          requestedGameId,
        }),
      }),
    );

    const result = (await response.json()) as StartGameResponse;

    if (result.success) {
      // Store direct gameId to puzzleId mapping for reliable command routing
      const gameIdMappingKey = `gameId_to_puzzleId:${requestedGameId}`;
      await c.env.KV.put(gameIdMappingKey, puzzleId, {
        expirationTtl: 60 * 60 * 24 * 7,
      }); // 7 days
    }

    return c.json(result);
  } catch (error) {
    console.error("Start game error:", error);
    return c.json<StartGameResponse>(
      {
        success: false,
        error: "Failed to start game",
      },
      500,
    );
  }
}
