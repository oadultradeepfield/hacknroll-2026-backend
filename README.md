# Gitty Backend

**Gittty** is a Wordle-like game designed to help users learn Git commands, built by team **Kopibara C Peng** for Hack&Roll 2026. This repository hosts the backend infrastructure, managed as a monorepo using PNPM workspaces.

## Architecture

The project is divided into applications and shared packages:

### Applications

- **`user-application`**: Hono-based backend handling user-facing APIs, CRUD operations, and proxying game requests.
- **`data-service`**: Hono-based backend managing game state via Cloudflare Durable Objects, alongside background tasks (leaderboards, puzzle generation).

### Packages (`@repo/*`)

- **`git-engine`**: Core game logic for generating and validating Git states.
- **`database`**: Database schema, models, and D1 migration utilities.
- **`shared`**: Common types and utilities used across the workspace.

## Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher
- **Cloudflare**: Account required for Workers 

## Getting Started

1. **Install dependencies:**

```bash
pnpm install
```

2. **Configure Environment:**
   Create an `.env` file in `packages/database` with your Cloudflare credentials:

```txt
CLOUDFLARE_ACCOUNT_ID="YOUR_ACCOUNT_ID"
CLOUDFLARE_DATABASE_ID="YOUR_DATABASE_ID"
CLOUDFLARE_D1_TOKEN="YOUR_API_TOKEN"
```

3. **Build Packages:**
   Ensure local packages are built in the correct order:

```bash
pnpm run package:build
```

## Development Commands

Run the following commands from the root directory:

| Category       | Command                        | Description                                                  |
| -------------- | ------------------------------ | ------------------------------------------------------------ |
| **Code Style** | `pnpm run lint:fix`            | Runs Biome to format and lint the codebase.                  |
| **Build**      | `pnpm run package:build`       | Builds shared packages (`database`, `git-engine`, `shared`). |
| **Database**   | `pnpm run db:generate`         | Generates types and schema files.                            |
|                | `pnpm run db:pull`             | Pulls the latest schema from Cloudflare D1.                  |
|                | `pnpm run db:migrate`          | Applies pending migrations to D1.                            |
| **Deployment** | `pnpm run deploy:user-app`     | Deploys the user application to Cloudflare Workers.          |
|                | `pnpm run deploy:data-service` | Deploys the data service (Durable Objects).                  |

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
