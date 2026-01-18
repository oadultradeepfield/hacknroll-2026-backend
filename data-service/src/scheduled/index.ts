import { generateLeaderboardSnapshotTask } from "./leaderboard-snapshot";
import { generateDailyPuzzleTask } from "./puzzle-generator";

export async function handleScheduled(event: ScheduledEvent): Promise<void> {
  const hour = new Date(event.scheduledTime).getUTCHours();

  switch (hour) {
    case 18: // 6 PM UTC - Generate tomorrow's puzzle
      await generateDailyPuzzleTask();
      break;
    case 0: // Midnight UTC - Generate leaderboard snapshot
      await generateLeaderboardSnapshotTask();
      break;
    default:
      await generateLeaderboardSnapshotTask();
      console.log(`No scheduled task for hour ${hour}`);
  }
}
