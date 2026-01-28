-- Venue planner tables for couples and vendors

CREATE TABLE IF NOT EXISTS couple_venue_bookings (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id varchar NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  venue_name text NOT NULL,
  date text NOT NULL,
  time text,
  location text,
  capacity integer,
  notes text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS couple_venue_timelines (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id varchar NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE UNIQUE,
  venue_selected boolean DEFAULT false,
  venue_visited boolean DEFAULT false,
  contract_signed boolean DEFAULT false,
  deposit_paid boolean DEFAULT false,
  capacity integer,
  budget integer,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_venue_bookings (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id varchar NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  couple_name text NOT NULL,
  date text NOT NULL,
  time text,
  location text,
  capacity integer,
  notes text,
  status text DEFAULT 'booked',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_venue_availability (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id varchar NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  date text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  max_bookings integer,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_venue_availability_vendor_date ON vendor_venue_availability (vendor_id, date);
CREATE INDEX IF NOT EXISTS idx_vendor_venue_availability_vendor ON vendor_venue_availability (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_venue_availability_date ON vendor_venue_availability (date);

CREATE TABLE IF NOT EXISTS vendor_venue_timelines (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id varchar NOT NULL REFERENCES vendors(id) ON DELETE CASCADE UNIQUE,
  site_visit_done boolean DEFAULT false,
  contract_signed boolean DEFAULT false,
  deposit_received boolean DEFAULT false,
  floor_plan_finalized boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
