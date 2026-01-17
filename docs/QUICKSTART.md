# Frontend Quick Start Guide

This guide details how to integrate the User Application REST API into a TypeScript frontend.

## Environment Configuration

**Base URLs**

- **Production:** `https://your-worker-domain.workers.dev`
- **Development:** `http://localhost:8787`

**Prerequisites**
Ensure you have the shared type definitions installed:

```typescript
import type {
  StartGameRequest,
  Command,
  GameState,
  LeaderboardResponse,
} from "@repo/shared";
```

## Authentication

The API uses **IP-based authentication**. No `Authorization` headers or tokens are required. The backend automatically identifies the user based on the request IP and User-Agent.

## Core Integration Flow

### 1. Start a Game Session

Initialize a session using the daily puzzle ID or a specific puzzle ID.

```typescript
const startResponse = await fetch(`${BASE_URL}/game/start`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ gameId: "daily" }),
});

const { gameState, puzzle, isCompleted } = await startResponse.json();
```

### 2. Execute Commands

Send git commands to progress the game state.

```typescript
const commandResponse = await fetch(`${BASE_URL}/game/command`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    gameId: "daily",
    command: { type: "commit", message: "Initial commit" },
  }),
});

const data = await commandResponse.json();

if (data.success) {
  // Update UI with new state
  updateGraph(data.gameState);

  // Check for victory condition
  if (data.isCompleted) {
    showRewards(data.rewards);
  }
}
```

## Command Payload Reference

The `command` object supports the following structures:

**Basic Actions**

```typescript
{ type: 'commit', message: 'feat: add login' }
{ type: 'undo' }

```

**Branching & Merging**

```typescript
{ type: 'branch', name: 'feature-auth' }
{ type: 'checkout', target: 'feature-auth' } // target can be branch name or commit sha
{ type: 'merge', branch: 'feature-auth' }
{ type: 'rebase', onto: 'main' }

```

## Example Implementation: React Hook

A reusable hook to manage game logic and state.

```typescript
import { useState } from "react";
import type { GameState, Command, Rewards } from "@repo/shared";

export function useGame(gameId: string) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const startGame = async () => {
    const res = await fetch("/game/start", {
      method: "POST",
      body: JSON.stringify({ gameId }),
    });
    const data = await res.json();
    setGameState(data.gameState);
    setIsCompleted(data.isCompleted);
  };

  const executeCommand = async (command: Command) => {
    const res = await fetch("/game/command", {
      method: "POST",
      body: JSON.stringify({ gameId, command }),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.error);

    setGameState(data.gameState);
    setIsCompleted(data.isCompleted);

    // Return rewards if just completed
    return data.isCompleted ? data.rewards : null;
  };

  return { gameState, isCompleted, startGame, executeCommand };
}
```

## Other Endpoints

### User Profile

```typescript
// Get Profile
const profile = await fetch("/user/profile").then((r) => r.json());

// Set Username
await fetch("/user/set-name", {
  method: "POST",
  body: JSON.stringify({ username: "PlayerOne" }),
});
```

### Statistics & Leaderboard

```typescript
// User Stats
const { stats } = await fetch("/stats").then((r) => r.json());

// Leaderboard (Top 100)
const { entries, userRank } = await fetch("/leaderboard").then((r) => r.json());
```

## Best Practices

- **State Management:** Always use the `gameState` returned by the API response to update your UI. Do not attempt to predict the git graph state locally.
- **Completion Check:** Check `isCompleted` after every command execution.
- **Caching:** The leaderboard endpoint is cached server-side for 5 minutes.
- **Daily ID:** Use `"daily"` as the `gameId` to automatically route users to the current day's challenge.

### Next Steps

Would you like me to create a **Postman Collection** JSON file based on these examples for testing?
