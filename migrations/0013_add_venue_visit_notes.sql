-- Add site visit scheduling and notes fields to couple_venue_bookings
ALTER TABLE couple_venue_bookings
ADD COLUMN site_visit_date TEXT,
ADD COLUMN site_visit_time TEXT,
ADD COLUMN visit_notes_liked TEXT,
ADD COLUMN visit_notes_unsure TEXT;

-- Add index for site visits
CREATE INDEX idx_couple_venue_site_visits 
ON couple_venue_bookings(site_visit_date) 
WHERE site_visit_date IS NOT NULL;
