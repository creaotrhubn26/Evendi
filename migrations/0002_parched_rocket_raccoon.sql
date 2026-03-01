CREATE TABLE "couple_budget_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"estimated_cost" integer DEFAULT 0 NOT NULL,
	"actual_cost" integer,
	"is_paid" boolean DEFAULT false NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_budget_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"total_budget" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'NOK' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_budget_settings_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_cake_designs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"tiers" integer DEFAULT 3,
	"flavor" text,
	"filling" text,
	"frosting" text,
	"style" text,
	"estimated_price" integer DEFAULT 0,
	"estimated_servings" integer,
	"is_favorite" boolean DEFAULT false,
	"is_selected" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_cake_tastings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"bakery_name" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"location" text,
	"flavors_to_try" text,
	"notes" text,
	"rating" integer,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_cake_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"bakery_selected" boolean DEFAULT false,
	"bakery_selected_date" text,
	"tasting_completed" boolean DEFAULT false,
	"tasting_date" text,
	"design_finalized" boolean DEFAULT false,
	"design_finalized_date" text,
	"deposit_paid" boolean DEFAULT false,
	"delivery_confirmed" boolean DEFAULT false,
	"budget" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_cake_timeline_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_catering_dietary_needs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"guest_name" text NOT NULL,
	"dietary_type" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_catering_menu" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"course_type" text NOT NULL,
	"dish_name" text NOT NULL,
	"description" text,
	"is_vegetarian" boolean DEFAULT false,
	"is_vegan" boolean DEFAULT false,
	"is_gluten_free" boolean DEFAULT false,
	"is_selected" boolean DEFAULT false,
	"price_per_person" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_catering_tastings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"caterer_name" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"location" text,
	"notes" text,
	"rating" integer,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_catering_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"caterer_selected" boolean DEFAULT false,
	"caterer_selected_date" text,
	"tasting_completed" boolean DEFAULT false,
	"tasting_date" text,
	"menu_finalized" boolean DEFAULT false,
	"menu_finalized_date" text,
	"guest_count_confirmed" boolean DEFAULT false,
	"guest_count" integer DEFAULT 0,
	"budget" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_catering_timeline_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_dress_appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"shop_name" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"notes" text,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_dress_favorites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"name" text NOT NULL,
	"designer" text,
	"shop" text,
	"price" integer DEFAULT 0,
	"image_url" text,
	"notes" text,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_dress_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"ordered" boolean DEFAULT false NOT NULL,
	"ordered_date" text,
	"first_fitting" boolean DEFAULT false NOT NULL,
	"first_fitting_date" text,
	"alterations" boolean DEFAULT false NOT NULL,
	"alterations_date" text,
	"final_fitting" boolean DEFAULT false NOT NULL,
	"final_fitting_date" text,
	"pickup" boolean DEFAULT false NOT NULL,
	"pickup_date" text,
	"budget" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_dress_timeline_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_event_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"event_type" text NOT NULL,
	"event_category" text NOT NULL,
	"corporate_sub_category" text,
	"guest_count" integer,
	"budget_min" integer,
	"budget_max" integer,
	"currency" text DEFAULT 'NOK',
	"event_location" text,
	"event_location_radius" integer,
	"desired_event_vibe" text,
	"special_requirements" text,
	"vendor_preferences" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_event_preferences_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_flower_appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"florist_name" text NOT NULL,
	"appointment_type" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"location" text,
	"notes" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_flower_selections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"item_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"quantity" integer DEFAULT 1,
	"estimated_price" integer DEFAULT 0,
	"is_confirmed" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_flower_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"florist_selected" boolean DEFAULT false,
	"florist_selected_date" text,
	"consultation_done" boolean DEFAULT false,
	"consultation_date" text,
	"mockup_approved" boolean DEFAULT false,
	"mockup_approved_date" text,
	"delivery_confirmed" boolean DEFAULT false,
	"budget" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_flower_timeline_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_hair_makeup_appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"stylist_name" text NOT NULL,
	"service_type" text NOT NULL,
	"appointment_type" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"location" text,
	"notes" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_hair_makeup_looks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"name" text NOT NULL,
	"look_type" text NOT NULL,
	"image_url" text,
	"notes" text,
	"is_favorite" boolean DEFAULT false,
	"is_selected" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_hair_makeup_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"consultation_booked" boolean DEFAULT false,
	"consultation_date" text,
	"trial_booked" boolean DEFAULT false,
	"trial_date" text,
	"look_selected" boolean DEFAULT false,
	"look_selected_date" text,
	"wedding_day_booked" boolean DEFAULT false,
	"budget" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_hair_makeup_timeline_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_important_people" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"phone" text,
	"email" text,
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_music_performances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"duration" text,
	"musician_name" text,
	"performance_type" text,
	"notes" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_music_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"spotify_playlist_url" text,
	"youtube_playlist_url" text,
	"entrance_song" text,
	"first_dance_song" text,
	"last_song" text,
	"do_not_play" text,
	"additional_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_music_preferences_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_music_setlists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"title" text NOT NULL,
	"songs" text,
	"genre" text,
	"duration" text,
	"mood" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_music_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"musician_selected" boolean DEFAULT false,
	"setlist_discussed" boolean DEFAULT false,
	"contract_signed" boolean DEFAULT false,
	"deposit_paid" boolean DEFAULT false,
	"budget" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_music_timeline_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_photo_shots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_photographer_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"location" text,
	"duration" text,
	"photographer_name" text,
	"notes" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_photographer_shots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"is_selected" boolean DEFAULT false,
	"priority" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_photographer_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"photographer_selected" boolean DEFAULT false,
	"session_booked" boolean DEFAULT false,
	"contract_signed" boolean DEFAULT false,
	"deposit_paid" boolean DEFAULT false,
	"budget" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_photographer_timeline_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_planner_meetings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"planner_name" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"location" text,
	"topic" text,
	"notes" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_planner_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"title" text NOT NULL,
	"due_date" text,
	"priority" text,
	"category" text,
	"notes" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_planner_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"planner_selected" boolean DEFAULT false,
	"initial_meeting" boolean DEFAULT false,
	"contract_signed" boolean DEFAULT false,
	"deposit_paid" boolean DEFAULT false,
	"timeline_created" boolean DEFAULT false,
	"budget" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_planner_timeline_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_transport_bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"vehicle_type" text NOT NULL,
	"provider_name" text,
	"vehicle_description" text,
	"pickup_time" text,
	"pickup_location" text,
	"dropoff_time" text,
	"dropoff_location" text,
	"driver_name" text,
	"driver_phone" text,
	"price" integer DEFAULT 0,
	"notes" text,
	"confirmed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_transport_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"bride_car_booked" boolean DEFAULT false,
	"groom_car_booked" boolean DEFAULT false,
	"guest_shuttle_booked" boolean DEFAULT false,
	"getaway_car_booked" boolean DEFAULT false,
	"all_confirmed" boolean DEFAULT false,
	"budget" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_transport_timeline_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_vendor_searches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"search_query" text NOT NULL,
	"event_type" text,
	"vendor_category" text,
	"results_count" integer,
	"clicked_vendor_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_venue_bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"vendor_id" varchar,
	"venue_name" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"location" text,
	"capacity" integer,
	"notes" text,
	"status" text DEFAULT 'considering',
	"is_primary" boolean DEFAULT false,
	"venue_type" text,
	"address" text,
	"max_guests" integer,
	"invited_guests" integer,
	"catering_included" boolean DEFAULT false,
	"accommodation_available" boolean DEFAULT false,
	"checkout_time" text,
	"site_visit_date" text,
	"site_visit_time" text,
	"visit_notes_liked" text,
	"visit_notes_unsure" text,
	"vendor_visit_confirmed" boolean DEFAULT false,
	"vendor_visit_notes" text,
	"vendor_visit_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_venue_timelines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"venue_selected" boolean DEFAULT false,
	"venue_visited" boolean DEFAULT false,
	"contract_signed" boolean DEFAULT false,
	"deposit_paid" boolean DEFAULT false,
	"capacity" integer,
	"budget" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_venue_timelines_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "couple_videographer_deliverables" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"format" text,
	"duration" text,
	"is_confirmed" boolean DEFAULT false,
	"delivery_date" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_videographer_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"location" text,
	"duration" text,
	"videographer_name" text,
	"notes" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couple_videographer_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" varchar NOT NULL,
	"videographer_selected" boolean DEFAULT false,
	"session_booked" boolean DEFAULT false,
	"contract_signed" boolean DEFAULT false,
	"deposit_paid" boolean DEFAULT false,
	"budget" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "couple_videographer_timeline_couple_id_unique" UNIQUE("couple_id")
);
--> statement-breakpoint
CREATE TABLE "creatorhub_analytics_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"creator_user_id" varchar,
	"booking_id" varchar,
	"event_type" text NOT NULL,
	"event_data" text,
	"source" text DEFAULT 'creatorhub',
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creatorhub_api_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"user_id" varchar,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status_code" integer,
	"request_body" text,
	"response_time" integer,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creatorhub_bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"creator_user_id" varchar NOT NULL,
	"vendor_id" varchar,
	"couple_id" varchar,
	"conversation_id" varchar,
	"offer_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"client_name" text NOT NULL,
	"client_email" text,
	"client_phone" text,
	"event_date" date NOT NULL,
	"event_time" text,
	"event_end_time" text,
	"location" text,
	"total_amount" integer,
	"deposit_amount" integer,
	"deposit_paid" boolean DEFAULT false,
	"full_paid" boolean DEFAULT false,
	"currency" text DEFAULT 'NOK',
	"status" text DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"internal_notes" text,
	"tags" text[],
	"external_ref" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creatorhub_crm_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"booking_id" varchar,
	"creator_user_id" varchar NOT NULL,
	"conversation_id" varchar,
	"note_type" text DEFAULT 'note' NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"due_date" timestamp,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creatorhub_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"invited_by" varchar NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'creator' NOT NULL,
	"token" text NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"accepted_at" timestamp,
	"accepted_user_id" varchar,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "creatorhub_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "creatorhub_projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo_url" text,
	"owner_id" varchar NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"api_key" text NOT NULL,
	"api_key_prefix" text NOT NULL,
	"webhook_url" text,
	"webhook_secret" text,
	"default_timezone" text DEFAULT 'Europe/Oslo',
	"default_currency" text DEFAULT 'NOK',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "creatorhub_projects_slug_unique" UNIQUE("slug"),
	CONSTRAINT "creatorhub_projects_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "creatorhub_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"vendor_id" varchar,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'creator' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_category_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"handle_b2c" boolean DEFAULT true,
	"handle_b2b" boolean DEFAULT false,
	"b2b_sub_categories" text,
	"min_guest_count_b2c" integer,
	"max_guest_count_b2c" integer,
	"min_guest_count_b2b" integer,
	"max_guest_count_b2b" integer,
	"b2c_details" text,
	"b2b_details" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_event_type_expertise" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"event_type" text NOT NULL,
	"years_experience" integer,
	"completed_events" integer DEFAULT 0,
	"is_specialized" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_match_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"couple_id" varchar NOT NULL,
	"event_type_match" integer,
	"budget_match" integer,
	"capacity_match" integer,
	"location_match" integer,
	"vibe_match" integer,
	"review_score" integer,
	"overall_score" integer,
	"last_calculated_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
DROP INDEX "idx_vendor_availability_vendor_date";--> statement-breakpoint
DROP INDEX "idx_vendor_availability_vendor";--> statement-breakpoint
DROP INDEX "idx_vendor_availability_date";--> statement-breakpoint
ALTER TABLE "vendor_availability" ALTER COLUMN "date" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "couple_profiles" ADD COLUMN "event_type" text DEFAULT 'wedding';--> statement-breakpoint
ALTER TABLE "couple_profiles" ADD COLUMN "event_category" text DEFAULT 'personal';--> statement-breakpoint
ALTER TABLE "couple_budget_items" ADD CONSTRAINT "couple_budget_items_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_budget_settings" ADD CONSTRAINT "couple_budget_settings_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_cake_designs" ADD CONSTRAINT "couple_cake_designs_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_cake_tastings" ADD CONSTRAINT "couple_cake_tastings_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_cake_timeline" ADD CONSTRAINT "couple_cake_timeline_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_catering_dietary_needs" ADD CONSTRAINT "couple_catering_dietary_needs_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_catering_menu" ADD CONSTRAINT "couple_catering_menu_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_catering_tastings" ADD CONSTRAINT "couple_catering_tastings_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_catering_timeline" ADD CONSTRAINT "couple_catering_timeline_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_dress_appointments" ADD CONSTRAINT "couple_dress_appointments_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_dress_favorites" ADD CONSTRAINT "couple_dress_favorites_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_dress_timeline" ADD CONSTRAINT "couple_dress_timeline_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_event_preferences" ADD CONSTRAINT "couple_event_preferences_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_flower_appointments" ADD CONSTRAINT "couple_flower_appointments_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_flower_selections" ADD CONSTRAINT "couple_flower_selections_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_flower_timeline" ADD CONSTRAINT "couple_flower_timeline_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_hair_makeup_appointments" ADD CONSTRAINT "couple_hair_makeup_appointments_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_hair_makeup_looks" ADD CONSTRAINT "couple_hair_makeup_looks_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_hair_makeup_timeline" ADD CONSTRAINT "couple_hair_makeup_timeline_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_important_people" ADD CONSTRAINT "couple_important_people_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_music_performances" ADD CONSTRAINT "couple_music_performances_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_music_preferences" ADD CONSTRAINT "couple_music_preferences_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_music_setlists" ADD CONSTRAINT "couple_music_setlists_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_music_timeline" ADD CONSTRAINT "couple_music_timeline_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_photo_shots" ADD CONSTRAINT "couple_photo_shots_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_photographer_sessions" ADD CONSTRAINT "couple_photographer_sessions_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_photographer_shots" ADD CONSTRAINT "couple_photographer_shots_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_photographer_timeline" ADD CONSTRAINT "couple_photographer_timeline_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_planner_meetings" ADD CONSTRAINT "couple_planner_meetings_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_planner_tasks" ADD CONSTRAINT "couple_planner_tasks_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_planner_timeline" ADD CONSTRAINT "couple_planner_timeline_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_transport_bookings" ADD CONSTRAINT "couple_transport_bookings_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_transport_timeline" ADD CONSTRAINT "couple_transport_timeline_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_vendor_searches" ADD CONSTRAINT "couple_vendor_searches_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_vendor_searches" ADD CONSTRAINT "couple_vendor_searches_clicked_vendor_id_vendors_id_fk" FOREIGN KEY ("clicked_vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_venue_bookings" ADD CONSTRAINT "couple_venue_bookings_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_venue_bookings" ADD CONSTRAINT "couple_venue_bookings_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_venue_timelines" ADD CONSTRAINT "couple_venue_timelines_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_videographer_deliverables" ADD CONSTRAINT "couple_videographer_deliverables_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_videographer_sessions" ADD CONSTRAINT "couple_videographer_sessions_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_videographer_timeline" ADD CONSTRAINT "couple_videographer_timeline_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_analytics_events" ADD CONSTRAINT "creatorhub_analytics_events_project_id_creatorhub_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."creatorhub_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_analytics_events" ADD CONSTRAINT "creatorhub_analytics_events_creator_user_id_creatorhub_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."creatorhub_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_analytics_events" ADD CONSTRAINT "creatorhub_analytics_events_booking_id_creatorhub_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."creatorhub_bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_api_audit_log" ADD CONSTRAINT "creatorhub_api_audit_log_project_id_creatorhub_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."creatorhub_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_api_audit_log" ADD CONSTRAINT "creatorhub_api_audit_log_user_id_creatorhub_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."creatorhub_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_bookings" ADD CONSTRAINT "creatorhub_bookings_project_id_creatorhub_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."creatorhub_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_bookings" ADD CONSTRAINT "creatorhub_bookings_creator_user_id_creatorhub_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."creatorhub_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_bookings" ADD CONSTRAINT "creatorhub_bookings_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_bookings" ADD CONSTRAINT "creatorhub_bookings_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_bookings" ADD CONSTRAINT "creatorhub_bookings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_bookings" ADD CONSTRAINT "creatorhub_bookings_offer_id_vendor_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."vendor_offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_crm_notes" ADD CONSTRAINT "creatorhub_crm_notes_project_id_creatorhub_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."creatorhub_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_crm_notes" ADD CONSTRAINT "creatorhub_crm_notes_booking_id_creatorhub_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."creatorhub_bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_crm_notes" ADD CONSTRAINT "creatorhub_crm_notes_creator_user_id_creatorhub_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."creatorhub_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_crm_notes" ADD CONSTRAINT "creatorhub_crm_notes_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_invitations" ADD CONSTRAINT "creatorhub_invitations_project_id_creatorhub_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."creatorhub_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_invitations" ADD CONSTRAINT "creatorhub_invitations_invited_by_creatorhub_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."creatorhub_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_invitations" ADD CONSTRAINT "creatorhub_invitations_accepted_user_id_creatorhub_users_id_fk" FOREIGN KEY ("accepted_user_id") REFERENCES "public"."creatorhub_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_users" ADD CONSTRAINT "creatorhub_users_project_id_creatorhub_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."creatorhub_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatorhub_users" ADD CONSTRAINT "creatorhub_users_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_category_preferences" ADD CONSTRAINT "vendor_category_preferences_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_event_type_expertise" ADD CONSTRAINT "vendor_event_type_expertise_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_match_scores" ADD CONSTRAINT "vendor_match_scores_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_match_scores" ADD CONSTRAINT "vendor_match_scores_couple_id_couple_profiles_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_creatorhub_analytics_project_type" ON "creatorhub_analytics_events" USING btree ("project_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_creatorhub_analytics_created_at" ON "creatorhub_analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_creatorhub_bookings_project_date" ON "creatorhub_bookings" USING btree ("project_id","event_date");--> statement-breakpoint
CREATE INDEX "idx_creatorhub_bookings_creator" ON "creatorhub_bookings" USING btree ("creator_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_creatorhub_users_project_email" ON "creatorhub_users" USING btree ("project_id","email");--> statement-breakpoint
CREATE INDEX "idx_vendor_event_type" ON "vendor_event_type_expertise" USING btree ("vendor_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_vendor_match_couple" ON "vendor_match_scores" USING btree ("vendor_id","couple_id");