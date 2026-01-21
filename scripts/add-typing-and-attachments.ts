import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function addTypingAndAttachments() {
  console.log("Adding typing indicators and attachment support...");

  try {
    // Add typing indicator columns to conversations table
    await db.execute(sql`
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS couple_typing_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS vendor_typing_at TIMESTAMP
    `);
    console.log("✓ Added typing indicator columns to conversations table");

    // Add attachment columns to messages table
    await db.execute(sql`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS attachment_type TEXT
    `);
    console.log("✓ Added attachment columns to messages table");

    console.log("\n✅ Migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

addTypingAndAttachments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
