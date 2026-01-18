import { generatePuzzleForDate } from "../utils";

export class MonthSeedLock {
  private isSeeded: boolean = false;
  private seedingPromise: Promise<void> | null = null;

  constructor(private state: DurableObjectState) {
    this.state.blockConcurrencyWhile(async () => {
      this.isSeeded =
        (await this.state.storage.get<boolean>("seeded")) || false;
    });
  }

  async fetch(_req: Request): Promise<Response> {
    if (this.isSeeded) {
      return new Response("Already seeded", { status: 409 });
    }

    if (this.seedingPromise) {
      await this.seedingPromise;
      return new Response("Already seeded", { status: 409 });
    }

    return await this.state.blockConcurrencyWhile(async () => {
      const storedSeeded = await this.state.storage.get<boolean>("seeded");
      if (storedSeeded) {
        this.isSeeded = true;
        return new Response("Already seeded", { status: 409 });
      }

      await this.state.storage.put("seeded", true);
      this.isSeeded = true;

      this.seedingPromise = this.performSeeding();
      return new Response("OK");
    });
  }

  private async performSeeding(): Promise<void> {
    try {
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split("T")[0];
        try {
          await generatePuzzleForDate(dateString);
        } catch (error) {
          console.error(`Failed to seed puzzle for ${dateString}:`, error);
        }
      }
    } finally {
      this.seedingPromise = null;
    }
  }
}
