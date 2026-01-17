import { Hono } from "hono";
import { getArchivePuzzlesHandler } from "./archive";
import { commandHandler } from "./command";
import { startGameHandler } from "./start";

export const gameRoutes = new Hono<{
  Bindings: Cloudflare.Env;
  Variables: { userId: string };
}>();

gameRoutes.get("/archive", getArchivePuzzlesHandler);
gameRoutes.post("/start", startGameHandler);
gameRoutes.post("/command", commandHandler);
