-- Replace completed boolean with meaningful status field
-- Status: 'considering' (Vurderes), 'booked' (Booket), 'confirmed' (Bekreftet)

-- Couple venue bookings
ALTER TABLE couple_venue_bookings 
ADD COLUMN status TEXT DEFAULT 'considering';

-- Migrate existing data: completed=true -> 'confirmed', completed=false -> 'considering'
UPDATE couple_venue_bookings 
SET status = CASE 
  WHEN completed = true THEN 'confirmed'
  ELSE 'considering'
END;

-- Drop the old completed column
ALTER TABLE couple_venue_bookings DROP COLUMN completed;

-- Vendor venue bookings already have status field, just ensure consistent values
-- Update any legacy statuses to use new system
UPDATE vendor_venue_bookings 
SET status = CASE 
  WHEN status IS NULL OR status = '' THEN 'considering'
  WHEN status = 'booked' THEN 'booked'
  WHEN completed = true THEN 'confirmed'
  ELSE 'considering'
END;

-- Drop completed from vendor bookings too
ALTER TABLE vendor_venue_bookings DROP COLUMN IF EXISTS completed;
