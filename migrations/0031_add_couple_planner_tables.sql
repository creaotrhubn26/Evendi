-- Migration: Add couple planner tables (meetings, tasks, timeline)
CREATE TABLE IF NOT EXISTS couple_planner_meetings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id VARCHAR NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  planner_name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT,
  topic TEXT,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS couple_planner_tasks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id VARCHAR NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS couple_planner_timeline (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id VARCHAR NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE UNIQUE,
  planner_selected BOOLEAN DEFAULT false,
  initial_meeting BOOLEAN DEFAULT false,
  contract_signed BOOLEAN DEFAULT false,
  deposit_paid BOOLEAN DEFAULT false,
  timeline_created BOOLEAN DEFAULT false,
  budget INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
