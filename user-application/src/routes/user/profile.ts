import { getUserById } from "@repo/database";
import type { Context } from "hono";

export async function profileHandler(
  c: Context<{
    Bindings: Cloudflare.Env;
    Variables: { userId: string };
  }>,
) {
  const userId = c.get("userId");

  try {
    const user = await getUserById(userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return c.json({ error: "Failed to get profile" }, 500);
  }
}
