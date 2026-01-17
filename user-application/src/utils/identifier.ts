import { nanoid } from "nanoid";
import { hashString } from "./hasher";

export function generateUserId(ip: string, userAgent: string): string {
  const combined = `${ip}:${userAgent}`;
  const hash = hashString(combined);
  return `user_${hash.substring(0, 16)}_${nanoid(8)}`;
}

export function generateGameId(userId: string, puzzleId: string): string {
  return `game_${userId.substring(5, 21)}_${puzzleId}_${nanoid(8)}`;
}
