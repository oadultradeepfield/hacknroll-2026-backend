import { generatePuzzleForDate } from "../utils";

export async function generateDailyPuzzleTask(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const dateString = tomorrow.toISOString().split("T")[0];
  await generatePuzzleForDate(dateString);
}
