import { hashString } from "./hasher";

export function generateUserId(ip: string, userAgent: string): string {
  const combined = `${ip}:${userAgent}`;
  const hash = hashString(combined);
  return `user_${hash.substring(0, 24)}`;
}

export function generateGameId(userId: string, puzzleId: string): string {
  const combined = `${userId}:${puzzleId}`;
  const hash = hashString(combined);
  return `game_${hash.substring(0, 24)}`;
}
