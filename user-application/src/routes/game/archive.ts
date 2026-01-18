import { getArchivePuzzles } from "@repo/database";
import type { Context } from "hono";

export async function getArchivePuzzlesHandler(
  c: Context<{
    Bindings: Cloudflare.Env;
  }>,
) {
  try {
    const limit = parseInt(c.req.query("limit") || "100", 10);
    const offset = parseInt(c.req.query("offset") || "0", 10);

    const puzzles = await getArchivePuzzles(limit, offset);

    return c.json({
      success: true,
      data: puzzles,
    });
  } catch (error) {
    console.error("Get archive puzzles error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch archive puzzles",
      },
      500,
    );
  }
}
