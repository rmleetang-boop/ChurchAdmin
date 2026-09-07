import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  // Schema generation is offline. Drizzle still requires credentials to migrate.
  ...(connectionString ? { dbCredentials: { url: connectionString } } : {}),
});
