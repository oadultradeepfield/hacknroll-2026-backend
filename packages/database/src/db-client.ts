import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as relations from "./drizzle-out/relations";
import * as schema from "./drizzle-out/schema";

let db: DrizzleD1Database<typeof schema & typeof relations>;

export function initDatabase(bindingDb: D1Database) {
  db = drizzle(bindingDb, { schema: { ...schema, ...relations } });
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
