/*
  # Add Effort Level and Mood Tracking to Runs

  1. Schema Changes
    - Add `effort_level` column to runs table
    - Add `mood_rating` column to runs table
    - Add indexes for better query performance

  2. Data Types
    - `effort_level`: text enum for 'encouraged', 'mission_accomplished', 'personal_best'
    - `mood_rating`: integer from 1-6 representing mood scale
*/

-- Add effort level and mood tracking columns to runs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'effort_level'
  ) THEN
    ALTER TABLE runs ADD COLUMN effort_level text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'mood_rating'
  ) THEN
    ALTER TABLE runs ADD COLUMN mood_rating integer;
  END IF;
END $$;

-- Add check constraints for data validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'runs_effort_level_check'
  ) THEN
    ALTER TABLE runs ADD CONSTRAINT runs_effort_level_check 
    CHECK (effort_level IN ('encouraged', 'mission_accomplished', 'personal_best'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'runs_mood_rating_check'
  ) THEN
    ALTER TABLE runs ADD CONSTRAINT runs_mood_rating_check 
    CHECK (mood_rating >= 1 AND mood_rating <= 6);
  END IF;
END $$;

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS runs_effort_level_idx ON runs(effort_level);
CREATE INDEX IF NOT EXISTS runs_mood_rating_idx ON runs(mood_rating);
CREATE INDEX IF NOT EXISTS runs_user_effort_idx ON runs(user_id, effort_level);
CREATE INDEX IF NOT EXISTS runs_user_mood_idx ON runs(user_id, mood_rating);