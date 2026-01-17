import type { Config } from "drizzle-kit";

const config: Config = {
  out: "./src/drizzle-out",
  dialect: "sqlite",
  driver: "d1-http",
  schema: ["./src/drizzle-out/schema.ts"],
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: Environment variables are required for D1 configuration
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    // biome-ignore lint/style/noNonNullAssertion: Environment variables are required for D1 configuration
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    // biome-ignore lint/style/noNonNullAssertion: Environment variables are required for D1 configuration
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
};

export default config satisfies Config;
