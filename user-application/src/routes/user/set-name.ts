import { isUsernameTaken, updateUsername } from "@repo/database";
import type { SetNameRequest, SetNameResponse } from "@repo/shared";
import { UserSchema } from "@repo/shared";
import type { Context } from "hono";

export async function setNameHandler(
  c: Context<{
    Bindings: Cloudflare.Env;
    Variables: { userId: string };
  }>,
) {
  const userId = c.get("userId");
  const body = await c.req.json<SetNameRequest>();
  const { username } = body;

  try {
    const validation = UserSchema.pick({ username: true }).safeParse({
      username,
    });

    if (!validation.success) {
      return c.json<SetNameResponse>(
        {
          success: false,
          error: validation.error.message,
        },
        400,
      );
    }

    if (await isUsernameTaken(username)) {
      return c.json<SetNameResponse>(
        {
          success: false,
          error: "Username is already taken",
        },
        409,
      );
    }

    const updated = await updateUsername(userId, username);

    if (!updated) {
      return c.json<SetNameResponse>(
        {
          success: false,
          error: "User not found",
        },
        404,
      );
    }

    return c.json<SetNameResponse>({ success: true });
  } catch (error) {
    console.error("Set name error:", error);
    return c.json<SetNameResponse>(
      {
        success: false,
        error: "Failed to update username",
      },
      500,
    );
  }
}
