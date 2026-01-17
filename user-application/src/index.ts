import { WorkerEntrypoint } from "cloudflare:workers";
import { initDatabase } from "@repo/database";
import { app } from "./app";

export default class DataService extends WorkerEntrypoint<Cloudflare.Env> {
  constructor(ctx: ExecutionContext, env: Cloudflare.Env) {
    super(ctx, env);
    initDatabase(env.DB);
  }

  fetch(request: Request) {
    return app.fetch(request, this.env, this.ctx);
  }
}
