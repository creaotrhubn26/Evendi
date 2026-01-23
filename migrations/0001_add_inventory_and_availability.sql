CREATE TABLE "admin_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_message_at" timestamp DEFAULT now(),
	"vendor_unread_count" integer DEFAULT 0,
	"admin_unread_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_type" text NOT NULL,
	"sender_id" varchar NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp,
	"edited_at" timestamp,
	"attachment_url" text,
	"attachment_type" text,
	"video_guide_id" varchar
);
--> statement-breakpoint
CREATE TABLE "faq_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"icon" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"price_nok" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"max_inspiration_photos" integer DEFAULT 10 NOT NULL,
	"max_products" integer DEFAULT 5 NOT NULL,
	"max_monthly_offers" integer DEFAULT 10 NOT NULL,
	"max_monthly_deliveries" integer DEFAULT 5 NOT NULL,
	"max_storage_gb" integer DEFAULT 5 NOT NULL,
	"can_send_messages" boolean DEFAULT true NOT NULL,
	"can_receive_inquiries" boolean DEFAULT true NOT NULL,
	"can_create_offers" boolean DEFAULT true NOT NULL,
	"can_create_deliveries" boolean DEFAULT true NOT NULL,
	"can_showcase_work" boolean DEFAULT true NOT NULL,
	"has_advanced_analytics" boolean DEFAULT false NOT NULL,
	"has_prioritized_search" boolean DEFAULT false NOT NULL,
	"can_highlight_profile" boolean DEFAULT false NOT NULL,
	"can_use_video_gallery" boolean DEFAULT false NOT NULL,
	"has_review_badge" boolean DEFAULT false NOT NULL,
	"has_multiple_categories" boolean DEFAULT false NOT NULL,
	"commission_percentage" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"date" date NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"max_bookings" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_category_details" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"venue_capacity_min" integer,
	"venue_capacity_max" integer,
	"catering_min_guests" integer,
	"catering_max_guests" integer,
	"venue_type" text,
	"venue_location" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"subscription_id" varchar,
	"stripe_payment_intent_id" text,
	"stripe_invoice_id" text,
	"amount_nok" integer NOT NULL,
	"currency" text DEFAULT 'NOK' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"description" text,
	"billing_period_start" timestamp,
	"billing_period_end" timestamp,
	"paid_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "vendor_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"tier_id" varchar NOT NULL,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"paused_until" timestamp,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_usage_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"inspiration_photos_uploaded" integer DEFAULT 0 NOT NULL,
	"video_minutes_used" integer DEFAULT 0 NOT NULL,
	"storage_used_gb" integer DEFAULT 0 NOT NULL,
	"profile_views_count" integer DEFAULT 0 NOT NULL,
	"messages_sent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_guides" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"video_url" text NOT NULL,
	"thumbnail" text,
	"duration" text,
	"category" text DEFAULT 'vendor' NOT NULL,
	"icon" text DEFAULT 'video' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whats_new_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text DEFAULT 'vendor' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text DEFAULT 'star' NOT NULL,
	"min_app_version" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "checklist_tasks" DROP CONSTRAINT "checklist_tasks_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_inspiration_id_inspirations_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_inquiry_id_inspiration_inquiries_id_fk";
--> statement-breakpoint
ALTER TABLE "coordinator_invitations" DROP CONSTRAINT "coordinator_invitations_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "couple_sessions" DROP CONSTRAINT "couple_sessions_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "couple_vendor_contracts" DROP CONSTRAINT "couple_vendor_contracts_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "couple_vendor_contracts" DROP CONSTRAINT "couple_vendor_contracts_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "couple_vendor_contracts" DROP CONSTRAINT "couple_vendor_contracts_offer_id_vendor_offers_id_fk";
--> statement-breakpoint
ALTER TABLE "deliveries" DROP CONSTRAINT "deliveries_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "delivery_items" DROP CONSTRAINT "delivery_items_delivery_id_deliveries_id_fk";
--> statement-breakpoint
ALTER TABLE "guest_invitations" DROP CONSTRAINT "guest_invitations_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "inspiration_inquiries" DROP CONSTRAINT "inspiration_inquiries_inspiration_id_inspirations_id_fk";
--> statement-breakpoint
ALTER TABLE "inspiration_inquiries" DROP CONSTRAINT "inspiration_inquiries_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "inspiration_media" DROP CONSTRAINT "inspiration_media_inspiration_id_inspirations_id_fk";
--> statement-breakpoint
ALTER TABLE "inspirations" DROP CONSTRAINT "inspirations_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "inspirations" DROP CONSTRAINT "inspirations_category_id_inspiration_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "message_reminders" DROP CONSTRAINT "message_reminders_conversation_id_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "message_reminders" DROP CONSTRAINT "message_reminders_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "message_reminders" DROP CONSTRAINT "message_reminders_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "schedule_events" DROP CONSTRAINT "schedule_events_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "speeches" DROP CONSTRAINT "speeches_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "table_guest_assignments" DROP CONSTRAINT "table_guest_assignments_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "table_guest_assignments" DROP CONSTRAINT "table_guest_assignments_table_id_wedding_tables_id_fk";
--> statement-breakpoint
ALTER TABLE "table_guest_assignments" DROP CONSTRAINT "table_guest_assignments_guest_id_wedding_guests_id_fk";
--> statement-breakpoint
ALTER TABLE "table_seating_invitations" DROP CONSTRAINT "table_seating_invitations_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_features" DROP CONSTRAINT "vendor_features_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_inspiration_categories" DROP CONSTRAINT "vendor_inspiration_categories_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_inspiration_categories" DROP CONSTRAINT "vendor_inspiration_categories_category_id_inspiration_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_offer_items" DROP CONSTRAINT "vendor_offer_items_offer_id_vendor_offers_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_offer_items" DROP CONSTRAINT "vendor_offer_items_product_id_vendor_products_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_offers" DROP CONSTRAINT "vendor_offers_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_offers" DROP CONSTRAINT "vendor_offers_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_offers" DROP CONSTRAINT "vendor_offers_conversation_id_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_products" DROP CONSTRAINT "vendor_products_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_review_responses" DROP CONSTRAINT "vendor_review_responses_review_id_vendor_reviews_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_review_responses" DROP CONSTRAINT "vendor_review_responses_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_reviews" DROP CONSTRAINT "vendor_reviews_contract_id_couple_vendor_contracts_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_reviews" DROP CONSTRAINT "vendor_reviews_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_reviews" DROP CONSTRAINT "vendor_reviews_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "wedding_guests" DROP CONSTRAINT "wedding_guests_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "wedding_tables" DROP CONSTRAINT "wedding_tables_couple_id_couple_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "couple_profiles" ALTER COLUMN "display_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "couple_typing_at" timestamp;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "vendor_typing_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "edited_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_type" text;--> statement-breakpoint
ALTER TABLE "vendor_products" ADD COLUMN "track_inventory" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "vendor_products" ADD COLUMN "available_quantity" integer;--> statement-breakpoint
ALTER TABLE "vendor_products" ADD COLUMN "reserved_quantity" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vendor_products" ADD COLUMN "booking_buffer" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "admin_conversations" ADD CONSTRAINT "admin_conversations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_conversation_id_admin_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."admin_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_video_guide_id_video_guides_id_fk" FOREIGN KEY ("video_guide_id") REFERENCES "public"."video_guides"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_availability" ADD CONSTRAINT "vendor_availability_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_category_details" ADD CONSTRAINT "vendor_category_details_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_subscription_id_vendor_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."vendor_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_sessions" ADD CONSTRAINT "vendor_sessions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."subscription_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_usage_metrics" ADD CONSTRAINT "vendor_usage_metrics_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_vendor_availability_vendor_date" ON "vendor_availability" USING btree ("vendor_id","date");--> statement-breakpoint
CREATE INDEX "idx_vendor_availability_vendor" ON "vendor_availability" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_vendor_availability_date" ON "vendor_availability" USING btree ("date");--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_tasks" ADD CONSTRAINT "checklist_tasks_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_inspiration_id_inspirations_id_fk" FOREIGN KEY ("inspiration_id") REFERENCES "public"."inspirations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_inquiry_id_inspiration_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inspiration_inquiries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coordinator_invitations" ADD CONSTRAINT "coordinator_invitations_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_sessions" ADD CONSTRAINT "couple_sessions_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_vendor_contracts" ADD CONSTRAINT "couple_vendor_contracts_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_vendor_contracts" ADD CONSTRAINT "couple_vendor_contracts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_vendor_contracts" ADD CONSTRAINT "couple_vendor_contracts_offer_id_vendor_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."vendor_offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_invitations" ADD CONSTRAINT "guest_invitations_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspiration_inquiries" ADD CONSTRAINT "inspiration_inquiries_inspiration_id_inspirations_id_fk" FOREIGN KEY ("inspiration_id") REFERENCES "public"."inspirations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspiration_inquiries" ADD CONSTRAINT "inspiration_inquiries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspiration_media" ADD CONSTRAINT "inspiration_media_inspiration_id_inspirations_id_fk" FOREIGN KEY ("inspiration_id") REFERENCES "public"."inspirations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspirations" ADD CONSTRAINT "inspirations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspirations" ADD CONSTRAINT "inspirations_category_id_inspiration_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."inspiration_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reminders" ADD CONSTRAINT "message_reminders_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reminders" ADD CONSTRAINT "message_reminders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reminders" ADD CONSTRAINT "message_reminders_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speeches" ADD CONSTRAINT "speeches_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_guest_assignments" ADD CONSTRAINT "table_guest_assignments_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_guest_assignments" ADD CONSTRAINT "table_guest_assignments_table_id_wedding_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."wedding_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_guest_assignments" ADD CONSTRAINT "table_guest_assignments_guest_id_wedding_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."wedding_guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_seating_invitations" ADD CONSTRAINT "table_seating_invitations_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_features" ADD CONSTRAINT "vendor_features_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_inspiration_categories" ADD CONSTRAINT "vendor_inspiration_categories_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_inspiration_categories" ADD CONSTRAINT "vendor_inspiration_categories_category_id_inspiration_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."inspiration_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_offer_items" ADD CONSTRAINT "vendor_offer_items_offer_id_vendor_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."vendor_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_offer_items" ADD CONSTRAINT "vendor_offer_items_product_id_vendor_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."vendor_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_offers" ADD CONSTRAINT "vendor_offers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_offers" ADD CONSTRAINT "vendor_offers_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_offers" ADD CONSTRAINT "vendor_offers_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_review_responses" ADD CONSTRAINT "vendor_review_responses_review_id_vendor_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."vendor_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_review_responses" ADD CONSTRAINT "vendor_review_responses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_contract_id_couple_vendor_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."couple_vendor_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_guests" ADD CONSTRAINT "wedding_guests_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_tables" ADD CONSTRAINT "wedding_tables_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;