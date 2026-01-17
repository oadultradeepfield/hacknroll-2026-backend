import { WorkerEntrypoint } from "cloudflare:workers";
import { initDatabase } from "@repo/database";
import { app } from "./app";
import { GameSession } from "./durable-objects/game-session";
import { MonthSeedLock } from "./durable-objects/month-seed-lock";
import { handleScheduled } from "./scheduled";

export { GameSession };
export { MonthSeedLock };

export default class DataService extends WorkerEntrypoint<Cloudflare.Env> {
  constructor(ctx: ExecutionContext, env: Cloudflare.Env) {
    super(ctx, env);
    initDatabase(env.DB);

    // Trigger seeder on every worker start
    // The Durable Object ensures it only runs once globally
    this.triggerSeeding(env, ctx);
  }

  private triggerSeeding(env: Cloudflare.Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        try {
          const id = env.MONTH_SEED_LOCK.idFromName("global-seeder-v2");
          const stub = env.MONTH_SEED_LOCK.get(id);
          const response = await stub.fetch("http://internal/seed");

          if (response.status === 200) {
            console.log("Seeding initiated successfully");
          } else {
            console.log("Seeding already completed:", await response.text());
          }
        } catch (error) {
          console.error("Failed to trigger seeding:", error);
        }
      })(),
    );
  }

  fetch(request: Request) {
    return app.fetch(request, this.env, this.ctx);
  }

  async scheduled(event: ScheduledEvent) {
    this.ctx.waitUntil(handleScheduled(event));
  }
}
