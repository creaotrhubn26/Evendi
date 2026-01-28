-- Add vendor notes and confirmation for site visits
ALTER TABLE couple_venue_bookings
ADD COLUMN vendor_visit_confirmed BOOLEAN DEFAULT false,
ADD COLUMN vendor_visit_notes TEXT,
ADD COLUMN vendor_visit_completed BOOLEAN DEFAULT false;

-- Add index for vendor visit status
CREATE INDEX idx_couple_venue_bookings_vendor_confirmed 
ON couple_venue_bookings(vendor_id, vendor_visit_confirmed) 
WHERE vendor_id IS NOT NULL AND site_visit_date IS NOT NULL;
