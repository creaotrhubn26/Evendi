import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const vendorCategories = pgTable("vendor_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  description: text("description"),
});

export const vendors = pgTable("vendors", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  businessName: text("business_name").notNull(),
  categoryId: varchar("category_id").references(() => vendorCategories.id),
  description: text("description"),
  location: text("location"),
  phone: text("phone"),
  website: text("website"),
  priceRange: text("price_range"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVendorCategorySchema = createInsertSchema(vendorCategories).pick({
  name: true,
  icon: true,
  description: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
});

export const vendorRegistrationSchema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(8, "Passord må være minst 8 tegn"),
  businessName: z.string().min(2, "Bedriftsnavn må være minst 2 tegn"),
  categoryId: z.string().min(1, "Velg en kategori"),
  description: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  priceRange: z.string().optional(),
});

export type InsertVendorCategory = z.infer<typeof insertVendorCategorySchema>;
export type VendorCategory = typeof vendorCategories.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type VendorRegistration = z.infer<typeof vendorRegistrationSchema>;

export const vendorFeatures = pgTable("vendor_features", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  featureKey: text("feature_key").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vendorInspirationCategories = pgTable("vendor_inspiration_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  categoryId: varchar("category_id").notNull().references(() => inspirationCategories.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export type VendorFeature = typeof vendorFeatures.$inferSelect;
export type VendorInspirationCategory = typeof vendorInspirationCategories.$inferSelect;

export const deliveries = pgTable("deliveries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  coupleName: text("couple_name").notNull(),
  coupleEmail: text("couple_email"),
  accessCode: text("access_code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  weddingDate: text("wedding_date"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deliveryItems = pgTable("delivery_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  deliveryId: varchar("delivery_id").notNull().references(() => deliveries.id),
  type: text("type").notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  accessCode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliveryItemSchema = createInsertSchema(deliveryItems).omit({
  id: true,
  createdAt: true,
});

export const createDeliverySchema = z.object({
  coupleName: z.string().min(2, "Navn må være minst 2 tegn"),
  coupleEmail: z.string().email("Ugyldig e-postadresse").optional().or(z.literal("")),
  title: z.string().min(2, "Tittel må være minst 2 tegn"),
  description: z.string().optional(),
  weddingDate: z.string().optional(),
  items: z.array(z.object({
    type: z.enum(["gallery", "video", "website", "download", "other"]),
    label: z.string().min(1, "Etikett er påkrevd"),
    url: z.string().url("Ugyldig URL"),
    description: z.string().optional(),
  })).min(1, "Legg til minst én leveranse"),
});

export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;
export type InsertDeliveryItem = z.infer<typeof insertDeliveryItemSchema>;
export type DeliveryItem = typeof deliveryItems.$inferSelect;
export type CreateDelivery = z.infer<typeof createDeliverySchema>;

export const inspirationCategories = pgTable("inspiration_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const inspirations = pgTable("inspirations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  categoryId: varchar("category_id").references(() => inspirationCategories.id),
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  priceSummary: text("price_summary"),
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
  currency: text("currency").default("NOK"),
  websiteUrl: text("website_url"),
  inquiryEmail: text("inquiry_email"),
  inquiryPhone: text("inquiry_phone"),
  ctaLabel: text("cta_label"),
  ctaUrl: text("cta_url"),
  allowInquiryForm: boolean("allow_inquiry_form").default(false),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inspirationMedia = pgTable("inspiration_media", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  inspirationId: varchar("inspiration_id").notNull().references(() => inspirations.id),
  type: text("type").notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInspirationCategorySchema = createInsertSchema(inspirationCategories).omit({
  id: true,
});

export const insertInspirationSchema = createInsertSchema(inspirations).omit({
  id: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInspirationMediaSchema = createInsertSchema(inspirationMedia).omit({
  id: true,
  createdAt: true,
});

export const createInspirationSchema = z.object({
  categoryId: z.string().min(1, "Velg en kategori"),
  title: z.string().min(2, "Tittel må være minst 2 tegn"),
  description: z.string().optional(),
  coverImageUrl: z.string().url("Ugyldig URL").optional().or(z.literal("")),
  priceSummary: z.string().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  currency: z.string().default("NOK"),
  websiteUrl: z.string().url("Ugyldig URL").optional().or(z.literal("")),
  inquiryEmail: z.string().email("Ugyldig e-post").optional().or(z.literal("")),
  inquiryPhone: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().url("Ugyldig URL").optional().or(z.literal("")),
  allowInquiryForm: z.boolean().default(false),
  media: z.array(z.object({
    type: z.enum(["image", "video"]),
    url: z.string().url("Ugyldig URL"),
    caption: z.string().optional(),
  })).min(1, "Legg til minst ett bilde eller video"),
});

export const inspirationInquiries = pgTable("inspiration_inquiries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  inspirationId: varchar("inspiration_id").notNull().references(() => inspirations.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  weddingDate: text("wedding_date"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const createInquirySchema = z.object({
  inspirationId: z.string(),
  name: z.string().min(2, "Navn må være minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  phone: z.string().optional(),
  message: z.string().min(10, "Melding må være minst 10 tegn"),
  weddingDate: z.string().optional(),
});

export type InsertInspirationCategory = z.infer<typeof insertInspirationCategorySchema>;
export type InspirationCategory = typeof inspirationCategories.$inferSelect;
export type InsertInspiration = z.infer<typeof insertInspirationSchema>;
export type Inspiration = typeof inspirations.$inferSelect;
export type InsertInspirationMedia = z.infer<typeof insertInspirationMediaSchema>;
export type InspirationMedia = typeof inspirationMedia.$inferSelect;
export type CreateInspiration = z.infer<typeof createInspirationSchema>;
export type InspirationInquiry = typeof inspirationInquiries.$inferSelect;
export type CreateInquiry = z.infer<typeof createInquirySchema>;
