-- ==========================================================
-- CSI Operations - Supabase Schema Migration & Sync Script
-- Run this in the Supabase SQL Editor to enable full sync
-- with the CSI Operations Web Application.
-- ==========================================================

-- 1. Ensure all rich event fields exist on the 'events' table
ALTER TABLE events ADD COLUMN IF NOT EXISTS time_start TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS time_end TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'Offline';
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT NOT NULL DEFAULT 'Auditorium';
ALTER TABLE events ADD COLUMN IF NOT EXISTS target_branches TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS faculty_in_charge TEXT NOT NULL DEFAULT 'Faculty Coordinator';
ALTER TABLE events ADD COLUMN IF NOT EXISTS brief_description TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS assigned_coordinators TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_form_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_form_edit_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_form_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_sheet_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_sheet_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_registration_closed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registered_attendees JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_google_form_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_google_form_edit_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_google_form_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_google_sheet_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_google_sheet_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_feedback_closed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_attendees JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS winners JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS certificate_templates JSONB DEFAULT '{}'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS certificate_writeups JSONB DEFAULT '{}'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_feedback_questions JSONB DEFAULT '[]'::jsonb;

-- 2. Populate assigned_coordinators from existing event_coordinators junction table
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_coordinators') THEN
    UPDATE events e
    SET assigned_coordinators = ARRAY(
      SELECT m.name 
      FROM event_coordinators ec
      JOIN members m ON ec.member_id = m.id
      WHERE ec.event_id = e.id
    )
    WHERE cardinality(e.assigned_coordinators) = 0 OR e.assigned_coordinators IS NULL;
  END IF;
END $$;

-- 3. Update coordinators assignment count for all 23 members
UPDATE members m
SET events_coordinated_count = (
  SELECT COUNT(*)
  FROM events e
  WHERE m.name = ANY(e.assigned_coordinators)
);

-- 4. Open RLS policies so the web application can read and write live data
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_coordinators') THEN
    ALTER TABLE event_coordinators DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

