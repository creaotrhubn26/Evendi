import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function migrate() {
  try {
    console.log("Adding edited_at column to messages table...");
    
    // Check if column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'edited_at';
    `);
    
    if (checkResult.rows.length > 0) {
      console.log("Column edited_at already exists, skipping migration.");
      await pool.end();
      return;
    }
    
    // Add the column
    await pool.query(`ALTER TABLE "messages" ADD COLUMN "edited_at" timestamp;`);
    
    console.log("Successfully added edited_at column!");
    await pool.end();
  } catch (error) {
    console.error("Migration failed:", error);
    await pool.end();
    throw error;
  }
}

migrate()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
