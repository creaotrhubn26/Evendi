-- Add decision-making fields to venue bookings
-- These help couples evaluate venues beyond basic info

-- Couple venue bookings
ALTER TABLE couple_venue_bookings 
ADD COLUMN address TEXT,
ADD COLUMN max_guests INTEGER,
ADD COLUMN invited_guests INTEGER,
ADD COLUMN catering_included BOOLEAN DEFAULT false,
ADD COLUMN accommodation_available BOOLEAN DEFAULT false,
ADD COLUMN checkout_time TEXT; -- When venue must be vacated (e.g., "23:00")

-- Vendor venue bookings (for consistency)
ALTER TABLE vendor_venue_bookings 
ADD COLUMN address TEXT,
ADD COLUMN max_guests INTEGER,
ADD COLUMN catering_included BOOLEAN DEFAULT false,
ADD COLUMN accommodation_available BOOLEAN DEFAULT false,
ADD COLUMN checkout_time TEXT;

-- Update existing capacity fields to max_guests for clarity
UPDATE couple_venue_bookings SET max_guests = capacity WHERE capacity IS NOT NULL;
UPDATE vendor_venue_bookings SET max_guests = capacity WHERE capacity IS NOT NULL;
