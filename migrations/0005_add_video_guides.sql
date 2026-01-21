-- Create video_guides table
CREATE TABLE IF NOT EXISTS video_guides (
  id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL,
  description text NOT NULL,
  video_url text NOT NULL,
  thumbnail text,
  duration text,
  category text NOT NULL DEFAULT 'vendor',
  icon text NOT NULL DEFAULT 'video',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_video_guides_category ON video_guides(category);
CREATE INDEX IF NOT EXISTS idx_video_guides_is_active ON video_guides(is_active);
