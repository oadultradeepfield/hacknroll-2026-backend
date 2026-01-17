# Gitty API Documentation

This API powers the User Application, providing endpoints for user profiles, git puzzle game sessions, and leaderboards.

**Base URL**

```
https://gitty-api.phanuphats.com
```

## Authentication

The API utilizes automatic user identification based on **IP Address** and **User-Agent**. No manual token generation or login handshake is required.

## Service Health

### GET /health

Verifies that the service is operational.

**Response**

```json
{
  "status": "ok",
  "service": "user-application"
}
```

## Users

### GET /user/profile

Retrieves the current user's profile information.

**Response**

```json
{
  "id": "user_abc123",
  "username": "player1",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### POST /user/set-name

Updates the current user's display name.

**Request Body**

```json
{
  "username": "newUsername"
}
```

**Response**

```json
{
  "success": true
}
```

**Status Codes**

- `200 OK`: Username updated successfully.
- `400 Bad Request`: Invalid username format.
- `409 Conflict`: Username is already taken.
- `404 Not Found`: User does not exist.

## Game Sessions

### POST /game/start

Initializes a new game session.

**Request Body**

- `gameId`: Use `"daily"` for the daily challenge or a specific puzzle ID.

```json
{
  "gameId": "daily"
}
```

**Response**
Returns the initial game state and puzzle details. If the user has already finished this puzzle, `isCompleted` will be `true` and a `rewards` object will be included.

```json
{
  "success": true,
  "gameState": {
    "commits": [],
    "branches": [],
    "head": "commit-id",
    "currentBranch": "main"
  },
  "puzzle": {
    "id": "puzzle_123",
    "title": "Git Basics",
    "description": "Learn basic git commands",
    "difficulty": "easy",
    "targetState": {},
    "parScore": 5
  },
  "isCompleted": false
}
```

### POST /game/command

Executes a git command within the active game session.

**Request Body**
Requires the `gameId` and a `command` object.

```json
{
  "gameId": "daily",
  "command": {
    "type": "commit",
    "message": "Initial commit"
  }
}
```

**Supported Command Types**

| Type         | Payload Structure                                 |
| ------------ | ------------------------------------------------- |
| **Commit**   | `{"type": "commit", "message": "msg"}`            |
| **Branch**   | `{"type": "branch", "name": "feature-branch"}`    |
| **Checkout** | `{"type": "checkout", "target": "branch-or-sha"}` |
| **Merge**    | `{"type": "merge", "branch": "target-branch"}`    |
| **Rebase**   | `{"type": "rebase", "onto": "target-branch"}`     |
| **Undo**     | `{"type": "undo"}`                                |

**Response (In Progress)**

```json
{
  "success": true,
  "gameState": {
    "commits": ["..."],
    "branches": ["..."],
    "head": "new-commit-id",
    "currentBranch": "main"
  },
  "isCompleted": false
}
```

**Response (Puzzle Completed)**

```json
{
  "success": true,
  "gameState": { "..." },
  "isCompleted": true,
  "rewards": {
    "score": 100,
    "parScore": 5,
    "commandsUsed": 4,
    "performance": "under_par",
    "bonusPoints": 20,
    "optimalSolution": ["..."]
  }
}

```

## Statistics & Leaderboard

### GET /stats

Retrieves the user's aggregate statistics and match history.

**Response**

```json
{
  "stats": {
    "userId": "user_abc123",
    "totalScore": 1500,
    "gamesPlayed": 25,
    "gamesCompleted": 20,
    "perfectScores": 5,
    "averageCommands": 6.5,
    "bestStreak": 7,
    "currentStreak": 3,
    "lastPlayedAt": "2024-01-15T10:30:00Z"
  },
  "recentGames": [
    {
      "id": "game_xyz",
      "status": "completed",
      "score": 100,
      "completedAt": "2024-01-15T09:15:00Z"
    }
  ]
}
```

### GET /leaderboard

Retrieves the top 100 players and the current user's rank. Results are cached for 5 minutes.

**Response**

```json
{
  "entries": [
    {
      "rank": 1,
      "username": "player1",
      "score": 5000,
      "gamesPlayed": 100
    }
  ],
  "userRank": 15,
  "userEntry": {
    "rank": 15,
    "username": "currentPlayer",
    "score": 1500,
    "gamesPlayed": 25
  }
}
```

## Errors & CORS

### Standard Error Responses

Unless otherwise specified, endpoints return standard HTTP status codes.

- **404 Not Found:** The requested resource or route does not exist.
- **500 Internal Server Error:** An unexpected server error occurred.

**Error Body Format**

```json
{
  "success": false,
  "error": "Description of the error"
}
```

### CORS Configuration

Cross-Origin Resource Sharing (CORS) is enabled for the configured frontend URL.

- **Allowed Methods:** `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Required Headers:** `Content-Type`, `Authorization`
