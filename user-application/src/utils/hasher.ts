import { createHash } from "node:crypto";

export function hashString(str: string): string {
  return createHash("sha256").update(str).digest("hex").substring(0, 32);
}
