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

async function migrate() {
  try {
    console.log("Adding password column to couple_profiles table...");
    
    // Check if column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'couple_profiles' 
      AND column_name = 'password';
    `);
    
    if (checkResult.rows.length > 0) {
      console.log("Column password already exists, skipping migration.");
      await pool.end();
      return;
    }
    
    // Add the column
    await pool.query(`ALTER TABLE "couple_profiles" ADD COLUMN "password" text;`);
    
    // Set default for existing rows
    await pool.query(`UPDATE "couple_profiles" SET "password" = '' WHERE "password" IS NULL;`);
    
    // Make NOT NULL
    await pool.query(`ALTER TABLE "couple_profiles" ALTER COLUMN "password" SET NOT NULL;`);
    
    console.log("Successfully added password column!");
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
