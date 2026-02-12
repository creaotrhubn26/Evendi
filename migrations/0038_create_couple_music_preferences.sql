-- Create couple_music_preferences table (referenced in schema.ts but missing migration)
CREATE TABLE IF NOT EXISTS couple_music_preferences (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id VARCHAR NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE UNIQUE,
  spotify_playlist_url TEXT,
  youtube_playlist_url TEXT,
  entrance_song TEXT,
  first_dance_song TEXT,
  last_song TEXT,
  do_not_play TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
