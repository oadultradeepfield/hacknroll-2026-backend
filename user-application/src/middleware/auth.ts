import { getOrCreateUser } from "@repo/database";
import { createMiddleware } from "hono/factory";
import { generateUserId } from "../utils/identifier";

export const authMiddleware = createMiddleware<{
  Variables: { userId: string };
}>(async (c, next) => {
  if (c.req.path === "/health") {
    await next();
    return;
  }

  const cfConnectingIp = c.req.header("cf-connecting-ip") || "unknown";
  const userAgent = c.req.header("user-agent") || "unknown";

  const userId = generateUserId(cfConnectingIp, userAgent);
  await getOrCreateUser(userId);

  c.set("userId", userId);

  await next();
});
