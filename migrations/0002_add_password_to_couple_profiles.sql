ALTER TABLE "couple_profiles" ADD COLUMN "password" text;

-- For existing rows, we need to set a default password (won't be used since new registrations require password)
UPDATE "couple_profiles" SET "password" = '' WHERE "password" IS NULL;

-- Make password NOT NULL
ALTER TABLE "couple_profiles" ALTER COLUMN "password" SET NOT NULL;
