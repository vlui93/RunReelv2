/*
  # Fix Video Generations Schema and Foreign Key Constraints

  1. Schema Fixes
    - Remove invalid foreign key constraints
    - Drop non-existent column references
    - Ensure schema matches actual table structure
    - Add proper foreign key constraints for existing columns

  2. Security
    - Maintain RLS policies
    - Ensure proper user access controls
*/

-- Remove invalid foreign key constraints that reference non-existent tables
ALTER TABLE video_generations 
DROP CONSTRAINT IF EXISTS video_generations_achievement_id_fkey;

ALTER TABLE video_generations 
DROP CONSTRAINT IF EXISTS video_generations_template_id_fkey;

-- Remove columns that don't exist in the actual schema but are referenced in code
ALTER TABLE video_generations 
DROP COLUMN IF EXISTS achievement_id;

ALTER TABLE video_generations 
DROP COLUMN IF EXISTS template_id;

ALTER TABLE video_generations 
DROP COLUMN IF EXISTS video_format;

ALTER TABLE video_generations 
DROP COLUMN IF EXISTS generation_config;

-- Ensure the table has the correct structure based on the original schema
-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'script_content'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN script_content text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'cost_estimate'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN cost_estimate numeric(10,4);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN error_message text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add proper foreign key constraints for existing columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'video_generations' AND constraint_name = 'video_generations_user_id_fkey'
  ) THEN
    ALTER TABLE video_generations 
    ADD CONSTRAINT video_generations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for run_id to reference manual_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'video_generations' AND constraint_name = 'video_generations_run_id_fkey'
  ) THEN
    -- Check if manual_activities table exists before adding constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'manual_activities') THEN
      ALTER TABLE video_generations 
      ADD CONSTRAINT video_generations_run_id_fkey 
      FOREIGN KEY (run_id) REFERENCES manual_activities(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Update status constraint to ensure valid values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'video_generations' AND constraint_name = 'video_generations_status_check'
  ) THEN
    ALTER TABLE video_generations DROP CONSTRAINT video_generations_status_check;
  END IF;

  ALTER TABLE video_generations ADD CONSTRAINT video_generations_status_check
    CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]));
END $$;

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_video_generations_updated_at ON video_generations;
CREATE TRIGGER update_video_generations_updated_at
  BEFORE UPDATE ON video_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the final schema structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'video_generations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- List all foreign key constraints to verify they're correct
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'video_generations'::regclass 
AND contype = 'f';