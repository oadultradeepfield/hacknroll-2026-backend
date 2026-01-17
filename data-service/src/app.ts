import { Hono } from "hono";
import { generateSessionKey } from "./utils";

export const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.get("/health", (c) =>
  c.json({ status: "ok", service: "hacknroll-2026-data-service" }),
);

app.post("/game/start", async (c) => {
  const body = await c.req.json();
  const { userId, puzzleId, requestedGameId } = body;

  const sessionId = generateSessionKey(userId, puzzleId);
  const doId = c.env.GAME_SESSIONS.idFromName(sessionId);
  const doStub = c.env.GAME_SESSIONS.get(doId);

  return doStub.fetch(
    new Request("http://internal/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        puzzleId,
        requestedGameId,
      }),
    }),
  );
});

app.post("/game/command", async (c) => {
  const body = await c.req.json();
  const { userId, puzzleId, requestedGameId } = body;

  const sessionId = generateSessionKey(userId, puzzleId);
  const doId = c.env.GAME_SESSIONS.idFromName(sessionId);
  const doStub = c.env.GAME_SESSIONS.get(doId);

  return doStub.fetch(
    new Request("http://internal/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        puzzleId,
        requestedGameId,
      }),
    }),
  );
});
