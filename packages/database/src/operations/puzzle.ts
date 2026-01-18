import type { Puzzle } from "@repo/shared";
import { desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db-client";
import { puzzles } from "@/drizzle-out/schema";

function parsePuzzle(puzzle: {
  id: string;
  date: string | null;
  difficultyLevel: number;
  fileTargets: string;
  constraints: string;
  solution: string;
  parScore: number;
  createdAt: number;
}): Puzzle {
  return {
    ...puzzle,
    fileTargets: JSON.parse(puzzle.fileTargets),
    constraints: JSON.parse(puzzle.constraints),
    solution: JSON.parse(puzzle.solution),
  };
}

function stringifyPuzzle(puzzle: Puzzle): {
  difficultyLevel: number;
  fileTargets: string;
  constraints: string;
  solution: string;
  parScore: number;
  date: string | null;
  id: string;
} {
  return {
    difficultyLevel: puzzle.difficultyLevel,
    fileTargets: JSON.stringify(puzzle.fileTargets),
    constraints: JSON.stringify(puzzle.constraints),
    solution: JSON.stringify(puzzle.solution),
    parScore: puzzle.parScore,
    date: puzzle.date,
    id: puzzle.id,
  };
}

export async function createPuzzle(puzzle: Puzzle): Promise<Puzzle> {
  const db = getDb();
  const [created] = await db
    .insert(puzzles)
    .values({
      id: puzzle.id,
      difficultyLevel: puzzle.difficultyLevel,
      fileTargets: JSON.stringify(puzzle.fileTargets),
      constraints: JSON.stringify(puzzle.constraints),
      solution: JSON.stringify(puzzle.solution),
      parScore: puzzle.parScore,
      date: puzzle.date,
    })
    .returning();
  return parsePuzzle(created);
}

export async function getPuzzleById(
  puzzleId: string,
): Promise<Puzzle | undefined> {
  const db = getDb();
  const [puzzle] = await db
    .select()
    .from(puzzles)
    .where(eq(puzzles.id, puzzleId))
    .limit(1);
  return puzzle ? parsePuzzle(puzzle) : undefined;
}

export async function getPuzzleByDate(
  date: string,
): Promise<Puzzle | undefined> {
  const db = getDb();
  const [puzzle] = await db
    .select()
    .from(puzzles)
    .where(eq(puzzles.date, date))
    .limit(1);
  return puzzle ? parsePuzzle(puzzle) : undefined;
}

export async function getDailyPuzzle(): Promise<Puzzle | undefined> {
  const today = new Date().toISOString().split("T")[0];
  return getPuzzleByDate(today);
}

export async function getArchivePuzzles(
  limit: number = 100,
  offset: number = 0,
): Promise<Puzzle[]> {
  const db = getDb();
  const results = await db
    .select()
    .from(puzzles)
    .where(isNotNull(puzzles.date))
    .orderBy(desc(puzzles.date))
    .limit(limit)
    .offset(offset);
  return results.map(parsePuzzle);
}

export async function upsertPuzzle(puzzle: Puzzle): Promise<Puzzle> {
  const db = getDb();
  const stringified = stringifyPuzzle(puzzle);
  const [result] = await db
    .insert(puzzles)
    .values(stringified)
    .onConflictDoUpdate({
      target: puzzles.id,
      set: {
        difficultyLevel: puzzle.difficultyLevel,
        fileTargets: JSON.stringify(puzzle.fileTargets),
        constraints: JSON.stringify(puzzle.constraints),
        solution: JSON.stringify(puzzle.solution),
        parScore: puzzle.parScore,
      },
    })
    .returning();
  return parsePuzzle(result);
}

export async function puzzleExistsForDate(date: string): Promise<boolean> {
  const puzzle = await getPuzzleByDate(date);
  return puzzle !== undefined;
}
