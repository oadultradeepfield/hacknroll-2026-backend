export function generateSessionKey(userId: string, puzzleId: string): string {
  return `${userId}:${puzzleId}`;
}
