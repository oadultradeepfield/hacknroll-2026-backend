import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import { gameRoutes } from "./routes/game";
import { leaderboardRoutes } from "./routes/leaderboard";
import { statsRoutes } from "./routes/stats";
import { userRoutes } from "./routes/user";
import { env } from "cloudflare:workers";

export const app = new Hono<{
  Bindings: Cloudflare.Env;
  Variables: { userId: string };
}>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", env.FRONTEND_URL],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("*", authMiddleware);

app.get("/health", (c) =>
  c.json({ status: "ok", service: "user-application" }),
);

app.route("/game", gameRoutes);
app.route("/user", userRoutes);
app.route("/stats", statsRoutes);
app.route("/leaderboard", leaderboardRoutes);

app.onError((err, c) => {
  console.error("Application error:", err);
  return c.json({ error: "Internal server error", message: err.message }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});
