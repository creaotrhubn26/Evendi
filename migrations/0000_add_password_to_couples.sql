CREATE TABLE "activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" varchar NOT NULL,
	"actor_name" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"previous_value" text,
	"new_value" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submitter_type" text NOT NULL,
	"submitter_id" varchar NOT NULL,
	"category" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "checklist_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"title" text NOT NULL,
	"months_before" integer DEFAULT 12 NOT NULL,
	"category" text DEFAULT 'planning' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"completed_by" varchar,
	"assigned_to" varchar,
	"notes" text,
	"linked_reminder_id" varchar,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"inspiration_id" varchar,
	"inquiry_id" varchar,
	"status" text DEFAULT 'active' NOT NULL,
	"last_message_at" timestamp DEFAULT now(),
	"couple_unread_count" integer DEFAULT 0,
	"vendor_unread_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"deleted_by_couple" boolean DEFAULT false,
	"deleted_by_vendor" boolean DEFAULT false,
	"couple_deleted_at" timestamp,
	"vendor_deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "coordinator_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"email" text,
	"name" text NOT NULL,
	"role_label" text DEFAULT 'Toastmaster' NOT NULL,
	"access_token" text NOT NULL,
	"access_code" text,
	"can_view_speeches" boolean DEFAULT true,
	"can_view_schedule" boolean DEFAULT true,
	"can_edit_speeches" boolean DEFAULT false,
	"can_edit_schedule" boolean DEFAULT false,
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp,
	"last_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "coordinator_invitations_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "couple_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"password" text NOT NULL,
	"partner_email" text,
	"wedding_date" text,
	"last_active_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "couple_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "couple_vendor_contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"offer_id" varchar,
	"status" text DEFAULT 'active' NOT NULL,
	"vendor_role" text,
	"notify_on_schedule_changes" boolean DEFAULT true,
	"notify_on_speech_changes" boolean DEFAULT true,
	"can_view_schedule" boolean DEFAULT true,
	"can_view_speeches" boolean DEFAULT false,
	"can_view_table_seating" boolean DEFAULT false,
	"notify_on_table_changes" boolean DEFAULT false,
	"completed_at" timestamp,
	"review_reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"couple_name" text NOT NULL,
	"couple_email" text,
	"access_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"wedding_date" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "deliveries_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE "delivery_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" varchar NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guest_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"template" text DEFAULT 'classic' NOT NULL,
	"message" text,
	"invite_token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"response_attending" boolean,
	"response_dietary" text,
	"response_allergies" text,
	"response_notes" text,
	"response_plus_one" text,
	"responded_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "guest_invitations_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "inspiration_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "inspiration_inquiries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspiration_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"wedding_date" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inspiration_media" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspiration_id" varchar NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inspirations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"category_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"price_summary" text,
	"price_min" integer,
	"price_max" integer,
	"currency" text DEFAULT 'NOK',
	"website_url" text,
	"inquiry_email" text,
	"inquiry_phone" text,
	"cta_label" text,
	"cta_url" text,
	"allow_inquiry_form" boolean DEFAULT false,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"couple_id" varchar NOT NULL,
	"reminder_type" text DEFAULT 'gentle' NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"sent_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_type" text NOT NULL,
	"sender_id" varchar NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp,
	"deleted_by_couple" boolean DEFAULT false,
	"deleted_by_vendor" boolean DEFAULT false,
	"couple_deleted_at" timestamp,
	"vendor_deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_type" text NOT NULL,
	"recipient_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"payload" text,
	"related_entity_type" text,
	"related_entity_id" varchar,
	"actor_type" text,
	"actor_id" varchar,
	"actor_name" text,
	"read_at" timestamp,
	"sent_via" text DEFAULT 'in_app',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"reminder_date" timestamp NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"is_completed" boolean DEFAULT false,
	"notification_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"time" text NOT NULL,
	"title" text NOT NULL,
	"icon" text DEFAULT 'star',
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "speeches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar,
	"speaker_name" text NOT NULL,
	"role" text,
	"duration_minutes" integer DEFAULT 5 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"scheduled_time" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "table_guest_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"table_id" varchar NOT NULL,
	"guest_id" varchar NOT NULL,
	"seat_number" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "table_seating_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_type" text NOT NULL,
	"email" text,
	"phone" text,
	"access_token" text NOT NULL,
	"access_code" text NOT NULL,
	"can_see_guest_names" boolean DEFAULT true NOT NULL,
	"can_see_notes" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"last_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "table_seating_invitations_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vendor_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "vendor_features" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"feature_key" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_inspiration_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_offer_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" varchar NOT NULL,
	"product_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"line_total" integer NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_offers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"couple_id" varchar NOT NULL,
	"conversation_id" varchar,
	"title" text NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_amount" integer NOT NULL,
	"currency" text DEFAULT 'NOK',
	"valid_until" timestamp,
	"accepted_at" timestamp,
	"declined_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"unit_price" integer NOT NULL,
	"unit_type" text DEFAULT 'stk' NOT NULL,
	"lead_time_days" integer,
	"min_quantity" integer DEFAULT 1,
	"category_tag" text,
	"image_url" text,
	"is_archived" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_review_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"couple_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"body" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp,
	"approved_by" varchar,
	"editable_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"business_name" text NOT NULL,
	"organization_number" text,
	"category_id" varchar,
	"description" text,
	"location" text,
	"phone" text,
	"website" text,
	"price_range" text,
	"image_url" text,
	"google_review_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wedding_guests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"category" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"dietary_requirements" text,
	"allergies" text,
	"notes" text,
	"plus_one" boolean DEFAULT false NOT NULL,
	"plus_one_name" text,
	"table_number" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wedding_tables" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"table_number" integer NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"label" text,
	"seats" integer DEFAULT 8 NOT NULL,
	"is_reserved" boolean DEFAULT false NOT NULL,
	"notes" text,
	"vendor_notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_tasks" ADD CONSTRAINT "checklist_tasks_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_tasks" ADD CONSTRAINT "checklist_tasks_linked_reminder_id_reminders_id_fk" FOREIGN KEY ("linked_reminder_id") REFERENCES "public"."reminders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_inspiration_id_inspirations_id_fk" FOREIGN KEY ("inspiration_id") REFERENCES "public"."inspirations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_inquiry_id_inspiration_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inspiration_inquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coordinator_invitations" ADD CONSTRAINT "coordinator_invitations_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_sessions" ADD CONSTRAINT "couple_sessions_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_vendor_contracts" ADD CONSTRAINT "couple_vendor_contracts_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_vendor_contracts" ADD CONSTRAINT "couple_vendor_contracts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_vendor_contracts" ADD CONSTRAINT "couple_vendor_contracts_offer_id_vendor_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."vendor_offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_invitations" ADD CONSTRAINT "guest_invitations_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspiration_inquiries" ADD CONSTRAINT "inspiration_inquiries_inspiration_id_inspirations_id_fk" FOREIGN KEY ("inspiration_id") REFERENCES "public"."inspirations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspiration_inquiries" ADD CONSTRAINT "inspiration_inquiries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspiration_media" ADD CONSTRAINT "inspiration_media_inspiration_id_inspirations_id_fk" FOREIGN KEY ("inspiration_id") REFERENCES "public"."inspirations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspirations" ADD CONSTRAINT "inspirations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspirations" ADD CONSTRAINT "inspirations_category_id_inspiration_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."inspiration_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reminders" ADD CONSTRAINT "message_reminders_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reminders" ADD CONSTRAINT "message_reminders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reminders" ADD CONSTRAINT "message_reminders_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speeches" ADD CONSTRAINT "speeches_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_guest_assignments" ADD CONSTRAINT "table_guest_assignments_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_guest_assignments" ADD CONSTRAINT "table_guest_assignments_table_id_wedding_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."wedding_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_guest_assignments" ADD CONSTRAINT "table_guest_assignments_guest_id_wedding_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."wedding_guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_seating_invitations" ADD CONSTRAINT "table_seating_invitations_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_features" ADD CONSTRAINT "vendor_features_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_inspiration_categories" ADD CONSTRAINT "vendor_inspiration_categories_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_inspiration_categories" ADD CONSTRAINT "vendor_inspiration_categories_category_id_inspiration_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."inspiration_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_offer_items" ADD CONSTRAINT "vendor_offer_items_offer_id_vendor_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."vendor_offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_offer_items" ADD CONSTRAINT "vendor_offer_items_product_id_vendor_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."vendor_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_offers" ADD CONSTRAINT "vendor_offers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_offers" ADD CONSTRAINT "vendor_offers_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_offers" ADD CONSTRAINT "vendor_offers_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_review_responses" ADD CONSTRAINT "vendor_review_responses_review_id_vendor_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."vendor_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_review_responses" ADD CONSTRAINT "vendor_review_responses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_contract_id_couple_vendor_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."couple_vendor_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_category_id_vendor_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."vendor_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_guests" ADD CONSTRAINT "wedding_guests_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_tables" ADD CONSTRAINT "wedding_tables_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE no action ON UPDATE no action;