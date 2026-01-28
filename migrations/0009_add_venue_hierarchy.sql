-- Add fields to distinguish primary/secondary venues and venue types
ALTER TABLE couple_venue_bookings 
ADD COLUMN is_primary BOOLEAN DEFAULT false,
ADD COLUMN venue_type TEXT; -- 'ceremony', 'reception', 'party', 'accommodation', 'other'

-- Update existing bookings to set first one as primary
WITH first_booking AS (
  SELECT DISTINCT ON (couple_id) id, couple_id
  FROM couple_venue_bookings
  ORDER BY couple_id, created_at ASC
)
UPDATE couple_venue_bookings
SET is_primary = true
WHERE id IN (SELECT id FROM first_booking);
