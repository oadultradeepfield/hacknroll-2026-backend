import { WorkerEntrypoint } from "cloudflare:workers";
import { initDatabase } from "@repo/database";
import { app } from "./app";
import { GameSession } from "./durable-objects/game-session";
import { handleScheduled } from "./scheduled";
export { GameSession };

export default class DataService extends WorkerEntrypoint<Cloudflare.Env> {
  constructor(ctx: ExecutionContext, env: Cloudflare.Env) {
    super(ctx, env);
    initDatabase(env.DB);
  }

  fetch(request: Request) {
    return app.fetch(request, this.env, this.ctx);
  }

  async scheduled(event: ScheduledEvent) {
    this.ctx.waitUntil(handleScheduled(event));
  }
}
