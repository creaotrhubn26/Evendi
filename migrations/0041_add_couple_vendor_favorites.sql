-- Create couple_vendor_favorites table for shortlist/favorites functionality
CREATE TABLE IF NOT EXISTS couple_vendor_favorites (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id VARCHAR NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  vendor_id VARCHAR NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  notes TEXT,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(couple_id, vendor_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_couple_vendor_favorites ON couple_vendor_favorites(couple_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_couple_favorites ON couple_vendor_favorites(couple_id);
