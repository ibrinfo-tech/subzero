import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default {
  schema: [
    "./src/core/lib/db/baseSchema.ts",
    "./src/core/lib/db/permissionSchema.ts",
    "./src/core/lib/db/eventSchema.ts",
    "./src/modules/**/schemas/*Schema.ts"
  ],
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Verbose logging for debugging
  verbose: true,
  // Strict mode for better type safety
  strict: true,
} satisfies Config;