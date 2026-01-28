-- Link couple venue bookings to vendors for site visit scheduling
ALTER TABLE couple_venue_bookings
ADD COLUMN vendor_id VARCHAR REFERENCES vendors(id) ON DELETE SET NULL;

-- Add index for vendor lookups
CREATE INDEX idx_couple_venue_bookings_vendor 
ON couple_venue_bookings(vendor_id) 
WHERE vendor_id IS NOT NULL;

-- Add index for site visits by vendor
CREATE INDEX idx_couple_venue_bookings_vendor_site_visit 
ON couple_venue_bookings(vendor_id, site_visit_date) 
WHERE vendor_id IS NOT NULL AND site_visit_date IS NOT NULL;
