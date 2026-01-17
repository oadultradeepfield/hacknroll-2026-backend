import { Hono } from "hono";
import { commandHandler } from "./command";
import { startGameHandler } from "./start";

export const gameRoutes = new Hono<{
  Bindings: Cloudflare.Env;
  Variables: { userId: string };
}>();

gameRoutes.post("/start", startGameHandler);
gameRoutes.post("/command", commandHandler);
