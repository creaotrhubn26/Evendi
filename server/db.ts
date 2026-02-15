import { config } from "dotenv";
// Load .env with override so it wins over Codespace/system env vars
config({ path: ".env", override: true });
config({ path: ".env.local", override: true });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
