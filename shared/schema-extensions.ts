/**
 * Schema Extensions - Vendor Expertise & Couple Preferences
 * 
 * Adds support for:
 * 1. Vendor expertise tracking (which event types, B2B subcategories)
 * 2. Couple preferences/needs (helps with matching)
 * 3. Vendor B2B preferences (corporate event specialization)
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { vendors, coupleProfiles } from "./schema";

// ═════════════════════════════════════════════════════════════════════
// VENDOR EXPERTISE SYSTEM
// ═════════════════════════════════════════════════════════════════════

/**
 * Tracks which event types a vendor can handle.
 * This is the core of the matching system.
 */
export const vendorExpertise = pgTable("vendor_expertise", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  
  // Event type this vendor specializes in (e.g., "conference", "wedding", "summer_party")
  eventType: text("event_type").notNull(),
  
  // For B2B events: which corporate subcategory? (professional_strategic, social_relational, etc.)
  // Null = doesn't apply (e.g., for wedding vendors)
  corporateSubcategory: text("corporate_subcategory"),
  
  // Years of experience with this specific event type
  yearsExperience: integer("years_experience"),
  
  // Number of events completed (for credibility/sorting)
  eventsCompleted: integer("events_completed").default(0),
  
  // Typical guest count range for this event type
  typicalGuestCountMin: integer("typical_guest_count_min"),
  typicalGuestCountMax: integer("typical_guest_count_max"),
  
  // Budget tier this vendor targets for this event (budget_friendly, mid_range, premium, luxury)
  budgetTier: text("budget_tier"),
  
  // Is this expertise verified/approved by admin?
  isVerified: boolean("is_verified").default(false),
  
  // Custom expertise description (e.g., "Specialized in tech conferences with 500+ attendees")
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  vendorEventTypeIdx: index("idx_vendor_expertise_vendor_event").on(table.vendorId, table.eventType),
  eventTypeIdx: index("idx_vendor_expertise_event_type").on(table.eventType),
}));

export const insertVendorExpertiseSchema = createInsertSchema(vendorExpertise).omit({
  id: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
});

export const createVendorExpertiseSchema = z.object({
  eventType: z.string().min(1, "Event type is required"),
  corporateSubcategory: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  eventsCompleted: z.number().int().min(0).default(0),
  typicalGuestCountMin: z.number().int().min(1).optional(),
  typicalGuestCountMax: z.number().int().min(1).optional(),
  budgetTier: z.enum(["budget_friendly", "mid_range", "premium", "luxury"]).optional(),
  description: z.string().optional(),
});

export type VendorExpertise = typeof vendorExpertise.$inferSelect;
export type InsertVendorExpertise = z.infer<typeof insertVendorExpertiseSchema>;
export type CreateVendorExpertise = z.infer<typeof createVendorExpertiseSchema>;

// ═════════════════════════════════════════════════════════════════════
// VENDOR B2B PREFERENCES (for corporate event handling)
// ═════════════════════════════════════════════════════════════════════

/**
 * Corporate event specializations for vendors.
 * Used for B2B matching and filtering.
 */
export const vendorB2bPreferences = pgTable("vendor_b2b_preferences", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" })
    .unique(),
  
  // Does this vendor handle B2B/corporate events at all?
  handlesCorporateEvents: boolean("handles_corporate_events").default(false),
  
  // Typical corporate event size
  minAttendees: integer("min_attendees"),
  maxAttendees: integer("max_attendees"),
  
  // Corporate subcategories they specialize in (stored as JSON array)
  // E.g., ["professional_strategic", "social_relational"]
  corporateSpecializations: text("corporate_specializations").default("[]"),
  
  // Does vendor have experience with international/multilingual events?
  handlesInternational: boolean("handles_international").default(false),
  
  // Available languages
  languages: text("languages"),
  
  // Can handle last-minute bookings for corporate events?
  handlesLastMinute: boolean("handles_last_minute").default(false),
  
  // Corporate client references/case studies available
  hasClientReferences: boolean("has_client_references").default(false),
  
  // Notes on corporate capabilities
  corporateNotes: text("corporate_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  vendorB2bIdx: index("idx_vendor_b2b_vendor").on(table.vendorId),
}));

export const insertVendorB2bPreferencesSchema = createInsertSchema(vendorB2bPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createVendorB2bPreferencesSchema = z.object({
  handlesCorporateEvents: z.boolean().default(false),
  minAttendees: z.number().int().min(1).optional(),
  maxAttendees: z.number().int().min(1).optional(),
  corporateSpecializations: z.array(z.enum([
    "professional_strategic",
    "social_relational", 
    "external_facing",
    "hr_internal",
  ])).default([]),
  handlesInternational: z.boolean().default(false),
  languages: z.string().optional(),
  handlesLastMinute: z.boolean().default(false),
  hasClientReferences: z.boolean().default(false),
  corporateNotes: z.string().optional(),
});

export type VendorB2bPreferences = typeof vendorB2bPreferences.$inferSelect;
export type InsertVendorB2bPreferences = z.infer<typeof insertVendorB2bPreferencesSchema>;
export type CreateVendorB2bPreferences = z.infer<typeof createVendorB2bPreferencesSchema>;

// ═════════════════════════════════════════════════════════════════════
// COUPLE PREFERENCES SYSTEM (Event Preferences & Needs)
// ═════════════════════════════════════════════════════════════════════

/**
 * Couple preferences and needs - collected during onboarding
 * and while planning. Used to match with vendors.
 */
export const couplePreferences = pgTable("couple_preferences", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  coupleId: varchar("couple_id")
    .notNull()
    .references(() => coupleProfiles.id, { onDelete: "cascade" })
    .unique(),
  
  // Event planning info
  estimatedGuestCount: integer("estimated_guest_count"),
  eventDate: text("event_date"),
  eventLocation: text("event_location"),
  eventLocationCountry: text("event_location_country").default("Norway"),
  
  // Budget info
  estimatedBudgetMin: integer("estimated_budget_min"),
  estimatedBudgetMax: integer("estimated_budget_max"),
  budgetCurrency: text("budget_currency").default("NOK"),
  
  // Vendor preferences (JSON array of vendor IDs they like)
  preferredVendorIds: text("preferred_vendor_ids").default("[]"),
  
  // Vendor characteristics they value (JSON object)
  // E.g., { "eco_friendly": true, "local": true, "award_winning": true }
  vendorPreferences: jsonb("vendor_preferences"),
  
  // For B2B planning: corporate event specifics
  isB2BEvent: boolean("is_b2b_event").default(false),
  corporateEventType: text("corporate_event_type"), // conference, seminar, product_launch, etc.
  corporateAttendeeType: text("corporate_attendee_type"), // employees, clients, industry_professionals, etc.
  
  // Special requirements
  specialRequirements: text("special_requirements"),
  
  // Accessibility needs
  requiresAccessibility: boolean("requires_accessibility").default(false),
  accessibilityNotes: text("accessibility_notes"),
  
  // Dietary requirements prevalence
  hasDietaryRequirements: boolean("has_dietary_requirements").default(false),
  
  // International guests?
  hasInternationalGuests: boolean("has_international_guests").default(false),
  
  // Languages needed
  languages: text("languages"), // comma-separated
  
  // Cultural/religious considerations  
  culturalTraditions: text("cultural_traditions"), // comma-separated, references cultural_traditions from CoupleLoginScreen
  
  completedOnboarding: boolean("completed_onboarding").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  couplePreferencesIdx: index("idx_couple_preferences_couple").on(table.coupleId),
  b2bEventIdx: index("idx_couple_preferences_b2b").on(table.isB2BEvent),
}));

export const insertCouplePreferencesSchema = createInsertSchema(couplePreferences).omit({
  id: true,
  completedOnboarding: true,
  createdAt: true,
  updatedAt: true,
});

export const createCouplePreferencesSchema = z.object({
  estimatedGuestCount: z.number().int().min(1).optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  eventLocationCountry: z.string().default("Norway"),
  estimatedBudgetMin: z.number().int().min(0).optional(),
  estimatedBudgetMax: z.number().int().min(0).optional(),
  budgetCurrency: z.string().default("NOK"),
  vendorPreferences: z.record(z.any()).optional(),
  isB2BEvent: z.boolean().default(false),
  corporateEventType: z.string().optional(),
  corporateAttendeeType: z.string().optional(),
  specialRequirements: z.string().optional(),
  requiresAccessibility: z.boolean().default(false),
  accessibilityNotes: z.string().optional(),
  hasDietaryRequirements: z.boolean().default(false),
  hasInternationalGuests: z.boolean().default(false),
  languages: z.string().optional(),
  culturalTraditions: z.string().optional(),
});

export type CouplePreferences = typeof couplePreferences.$inferSelect;
export type InsertCouplePreferences = z.infer<typeof insertCouplePreferencesSchema>;
export type CreateCouplePreferences = z.infer<typeof createCouplePreferencesSchema>;

// ═════════════════════════════════════════════════════════════════════
// VENDOR SEARCH INDEX (denormalized for fast searching)
// ═════════════════════════════════════════════════════════════════════

/**
 * Denormalized search index for fast vendor discovery.
 * Updated whenever vendor expertise, preferences, or profile changes.
 * Enables keyword search like "conference" or "eco-friendly catering".
 */
export const vendorSearchIndex = pgTable("vendor_search_index", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" })
    .unique(),
  
  // Concatenated searchable text (business name, category, event types, description)
  searchText: text("search_text").notNull(),
  
  // Event types this vendor can handle (array as text for search)
  eventTypes: text("event_types"), // "wedding,conference,seminar"
  
  // Keywords extracted from description and expertise
  keywords: text("keywords"), // comma-separated: "photography,eco-friendly,drone,drone-photography"
  
  // Vendor tier (budget_friendly, mid_range, premium, luxury)
  vendorTier: text("vendor_tier"),
  
  // Geographic region (for location-based search)
  region: text("region"),
  
  // Search rank score (for sorting results) - updated based on reviews, completeness, etc.
  searchRank: integer("search_rank").default(0),
  
  // Last updated timestamp (for cache invalidation)
  indexedAt: timestamp("indexed_at").defaultNow(),
}, (table) => ({
  vendorIdIdx: index("idx_vendor_search_vendor").on(table.vendorId),
  searchTextIdx: index("idx_vendor_search_text").on(table.searchText),
  eventTypesIdx: index("idx_vendor_search_events").on(table.eventTypes),
  keywordsIdx: index("idx_vendor_search_keywords").on(table.keywords),
}));

export type VendorSearchIndex = typeof vendorSearchIndex.$inferSelect;
export type InsertVendorSearchIndex = z.infer<typeof insertVendorSearchIndexSchema>;

export const insertVendorSearchIndexSchema = createInsertSchema(vendorSearchIndex).omit({
  id: true,
  indexedAt: true,
});
