import { Hono } from "hono";
import { profileHandler } from "./profile";
import { setNameHandler } from "./set-name";

export const userRoutes = new Hono<{
  Bindings: Cloudflare.Env;
  Variables: { userId: string };
}>();

userRoutes.post("/set-name", setNameHandler);
userRoutes.get("/profile", profileHandler);
