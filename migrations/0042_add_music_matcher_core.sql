-- Music Matcher core schema

ALTER TABLE couple_music_preferences
  ADD COLUMN IF NOT EXISTS preferred_cultures TEXT[],
  ADD COLUMN IF NOT EXISTS preferred_languages TEXT[],
  ADD COLUMN IF NOT EXISTS vibe_level INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS energy_level INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS clean_lyrics_only BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS selected_moments TEXT[];

CREATE TABLE IF NOT EXISTS music_moments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  default_energy INTEGER DEFAULT 50,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_music_moments_key ON music_moments(key);

CREATE TABLE IF NOT EXISTS music_songs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  youtube_video_id TEXT NOT NULL UNIQUE,
  bpm_min INTEGER,
  bpm_max INTEGER,
  energy_score INTEGER DEFAULT 50,
  dhol_score INTEGER DEFAULT 0,
  danceability INTEGER DEFAULT 50,
  popularity_score INTEGER DEFAULT 0,
  explicit_flag BOOLEAN DEFAULT FALSE,
  culture_tags TEXT[],
  language_tags TEXT[],
  tag_tokens TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_music_songs_video ON music_songs(youtube_video_id);

CREATE TABLE IF NOT EXISTS music_moment_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id VARCHAR NOT NULL REFERENCES music_moments(id) ON DELETE CASCADE,
  culture_key TEXT NOT NULL,
  default_weight INTEGER DEFAULT 50,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT idx_music_moment_profiles_moment_culture UNIQUE (moment_id, culture_key)
);

CREATE TABLE IF NOT EXISTS music_moment_song_rankings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id VARCHAR NOT NULL REFERENCES music_moments(id) ON DELETE CASCADE,
  song_id VARCHAR NOT NULL REFERENCES music_songs(id) ON DELETE CASCADE,
  culture_key TEXT,
  rank_score INTEGER DEFAULT 50,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT idx_music_ranking_moment_song_culture UNIQUE (moment_id, song_id, culture_key)
);

CREATE TABLE IF NOT EXISTS music_sets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id VARCHAR NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  offer_id VARCHAR REFERENCES vendor_offers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'private',
  created_by_role TEXT DEFAULT 'couple',
  updated_by_role TEXT DEFAULT 'couple',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_music_sets_couple ON music_sets(couple_id);
CREATE INDEX IF NOT EXISTS idx_music_sets_offer ON music_sets(offer_id);

CREATE TABLE IF NOT EXISTS music_set_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id VARCHAR NOT NULL REFERENCES music_sets(id) ON DELETE CASCADE,
  song_id VARCHAR REFERENCES music_songs(id) ON DELETE SET NULL,
  youtube_video_id TEXT,
  title TEXT NOT NULL,
  artist TEXT,
  moment_key TEXT,
  position INTEGER DEFAULT 0,
  drop_marker_seconds INTEGER,
  notes TEXT,
  added_by_role TEXT DEFAULT 'couple',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT idx_music_set_items_order UNIQUE (set_id, position)
);
CREATE INDEX IF NOT EXISTS idx_music_set_items_set ON music_set_items(set_id);

CREATE TABLE IF NOT EXISTS couple_youtube_connections (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id VARCHAR NOT NULL UNIQUE REFERENCES couple_profiles(id) ON DELETE CASCADE,
  youtube_channel_id TEXT,
  youtube_channel_title TEXT,
  access_token_enc TEXT,
  refresh_token_enc TEXT,
  token_expires_at TIMESTAMP,
  scope TEXT,
  connected_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS music_export_jobs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id VARCHAR NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  offer_id VARCHAR REFERENCES vendor_offers(id) ON DELETE SET NULL,
  set_id VARCHAR REFERENCES music_sets(id) ON DELETE SET NULL,
  youtube_playlist_id TEXT,
  youtube_playlist_url TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  requested_by_role TEXT NOT NULL,
  requested_by_vendor_id VARCHAR REFERENCES vendors(id) ON DELETE SET NULL,
  requested_by_couple_id VARCHAR REFERENCES couple_profiles(id) ON DELETE SET NULL,
  exported_track_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_music_export_jobs_couple ON music_export_jobs(couple_id);
CREATE INDEX IF NOT EXISTS idx_music_export_jobs_offer ON music_export_jobs(offer_id);
CREATE INDEX IF NOT EXISTS idx_music_export_jobs_status ON music_export_jobs(status);

CREATE TABLE IF NOT EXISTS couple_music_vendor_permissions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id VARCHAR NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  offer_id VARCHAR NOT NULL UNIQUE REFERENCES vendor_offers(id) ON DELETE CASCADE,
  vendor_id VARCHAR NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  can_export_youtube BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_music_vendor_permissions_vendor ON couple_music_vendor_permissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_music_vendor_permissions_couple ON couple_music_vendor_permissions(couple_id);
