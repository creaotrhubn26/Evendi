CREATE TABLE IF NOT EXISTS "vendor_vendor_conversations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendor_one_id" varchar NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
  "vendor_two_id" varchar NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
  "couple_id" varchar REFERENCES "couple_profiles"("id") ON DELETE SET NULL,
  "status" text NOT NULL DEFAULT 'active',
  "last_message_at" timestamp DEFAULT now(),
  "vendor_one_unread_count" integer DEFAULT 0,
  "vendor_two_unread_count" integer DEFAULT 0,
  "vendor_one_typing_at" timestamp,
  "vendor_two_typing_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "deleted_by_vendor_one" boolean DEFAULT false,
  "deleted_by_vendor_two" boolean DEFAULT false,
  "vendor_one_deleted_at" timestamp,
  "vendor_two_deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "vendor_vendor_messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" varchar NOT NULL REFERENCES "vendor_vendor_conversations"("id") ON DELETE CASCADE,
  "sender_vendor_id" varchar NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "read_at" timestamp,
  "edited_at" timestamp,
  "attachment_url" text,
  "attachment_type" text,
  "deleted_by_vendor_one" boolean DEFAULT false,
  "deleted_by_vendor_two" boolean DEFAULT false,
  "vendor_one_deleted_at" timestamp,
  "vendor_two_deleted_at" timestamp
);
