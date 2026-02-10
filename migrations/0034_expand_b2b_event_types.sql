-- Migration: Expand B2B event types with Norwegian corporate taxonomy
-- Replaces old "gala" type, adds: kickoff, summer_party, christmas_party,
-- trade_fair, corporate_anniversary, awards_night, employee_day, onboarding_day
--
-- B2B sub-categories:
--   1. Faglige og strategiske: conference, seminar, kickoff
--   2. Sosiale og relasjonsbyggende: summer_party, christmas_party, team_building
--   3. Eksternt rettede: product_launch, trade_fair
--   4. HR og interne: corporate_anniversary, awards_night, employee_day, onboarding_day

-- Update vendor category applicable_event_types with expanded B2B types
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','birthday','anniversary','engagement','baby_shower','conference','kickoff','summer_party','christmas_party','product_launch','trade_fair','corporate_anniversary','awards_night','employee_day','corporate_event'] WHERE "name" = 'Fotograf';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','anniversary','conference','kickoff','product_launch','corporate_anniversary','awards_night','corporate_event'] WHERE "name" = 'Videograf';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','anniversary','engagement','awards_night','corporate_anniversary'] WHERE "name" = 'Blomster';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','birthday','anniversary','engagement','baby_shower','conference','seminar','kickoff','summer_party','christmas_party','team_building','product_launch','corporate_anniversary','awards_night','employee_day','onboarding_day','corporate_event'] WHERE "name" = 'Catering';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','birthday','anniversary','engagement','summer_party','christmas_party','awards_night','corporate_anniversary','corporate_event'] WHERE "name" = 'Musikk';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','birthday','anniversary','engagement','baby_shower','conference','seminar','kickoff','summer_party','christmas_party','team_building','product_launch','trade_fair','corporate_anniversary','awards_night','employee_day','onboarding_day','corporate_event'] WHERE "name" = 'Venue';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','birthday','baby_shower','corporate_anniversary'] WHERE "name" = 'Kake';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','conference','kickoff','product_launch','awards_night','corporate_anniversary','corporate_event'] WHERE "name" = 'Planlegger';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','awards_night'] WHERE "name" = 'Hår & Makeup';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','conference','kickoff','awards_night','corporate_event'] WHERE "name" = 'Transport';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','birthday','anniversary','engagement','christmas_party','awards_night','corporate_anniversary','corporate_event'] WHERE "name" = 'Invitasjoner';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','birthday','anniversary','summer_party','christmas_party','team_building','awards_night','corporate_anniversary','employee_day','corporate_event'] WHERE "name" = 'Underholdning';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','birthday','anniversary','engagement','christmas_party','product_launch','awards_night','corporate_anniversary','corporate_event'] WHERE "name" = 'Dekorasjon';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','birthday','baby_shower','corporate_anniversary'] WHERE "name" = 'Konfektyrer';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','birthday','anniversary','summer_party','christmas_party','product_launch','awards_night','corporate_anniversary','corporate_event'] WHERE "name" = 'Bar & Drikke';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','confirmation','birthday','summer_party','christmas_party','awards_night','corporate_event'] WHERE "name" = 'Fotoboks';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','engagement'] WHERE "name" = 'Ringer';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding'] WHERE "name" = 'Drakt & Dress';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding','conference','kickoff','awards_night','corporate_event'] WHERE "name" = 'Overnatting';
UPDATE "vendor_categories" SET "applicable_event_types" = ARRAY['wedding'] WHERE "name" = 'Husdyr';

-- Migrate any existing "gala" event types to "awards_night"
UPDATE "couple_profiles" SET "event_type" = 'awards_night' WHERE "event_type" = 'gala';
