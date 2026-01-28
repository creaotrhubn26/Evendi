-- Add vendor notes and confirmation to couple venue bookings
ALTER TABLE couple_venue_bookings
ADD COLUMN vendor_notes TEXT,
ADD COLUMN vendor_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN vendor_confirmed_at TIMESTAMP;

-- Add index for vendor confirmed visits
CREATE INDEX idx_couple_venue_bookings_vendor_confirmed 
ON couple_venue_bookings(vendor_id, vendor_confirmed) 
WHERE vendor_id IS NOT NULL;
