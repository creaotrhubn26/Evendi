-- Add venue-specific fields to vendor products for proper inventory management
-- This connects vendor inventory with the booking fields couples see

ALTER TABLE vendor_products
ADD COLUMN venue_address TEXT,
ADD COLUMN venue_max_guests INTEGER,
ADD COLUMN venue_catering_included BOOLEAN DEFAULT false,
ADD COLUMN venue_accommodation_available BOOLEAN DEFAULT false,
ADD COLUMN venue_checkout_time TEXT,
ADD COLUMN venue_min_guests INTEGER; -- Minimum guests required for booking

-- Index for capacity-based searches
CREATE INDEX IF NOT EXISTS idx_vendor_products_capacity 
ON vendor_products(venue_max_guests, venue_min_guests) 
WHERE category_tag = 'venue';
