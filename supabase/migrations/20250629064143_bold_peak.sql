/*
  # Fix video_generations table schema

  This migration ensures the video_generations table has all required columns
  and fixes any schema inconsistencies that might cause PGRST204 errors.

  ## Changes Made
  1. Verify and add missing columns to video_generations table
  2. Update column types and constraints as needed
  3. Refresh schema cache
*/

-- Ensure the video_generations table exists with all required columns
DO $$
BEGIN
  -- Add generation_config column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'generation_config'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN generation_config jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add video_format column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'video_format'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN video_format text;
  END IF;

  -- Add template_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN template_id uuid;
  END IF;

  -- Add achievement_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'achievement_id'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN achievement_id uuid;
  END IF;

  -- Add script_content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'script_content'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN script_content text;
  END IF;

  -- Add cost_estimate column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'cost_estimate'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN cost_estimate numeric(10,4);
  END IF;

  -- Add error_message column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN error_message text;
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update the status column constraint to include all valid statuses
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'video_generations' AND constraint_name = 'video_generations_status_check'
  ) THEN
    ALTER TABLE video_generations DROP CONSTRAINT video_generations_status_check;
  END IF;

  -- Add updated constraint
  ALTER TABLE video_generations ADD CONSTRAINT video_generations_status_check
    CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]));
END $$;

-- Add video_format constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'video_generations' AND constraint_name = 'video_generations_format_check'
  ) THEN
    ALTER TABLE video_generations ADD CONSTRAINT video_generations_format_check
      CHECK (video_format IS NULL OR video_format = ANY (ARRAY['square'::text, 'vertical'::text, 'horizontal'::text]));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_generations_achievement_id ON video_generations(achievement_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_template_id ON video_generations(template_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_video_format ON video_generations(video_format);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add foreign key to achievements table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'video_generations' AND constraint_name = 'video_generations_achievement_id_fkey'
  ) THEN
    -- Only add if achievements table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
      ALTER TABLE video_generations ADD CONSTRAINT video_generations_achievement_id_fkey
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Add foreign key to video_templates table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'video_generations' AND constraint_name = 'video_generations_template_id_fkey'
  ) THEN
    -- Only add if video_templates table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_templates') THEN
      ALTER TABLE video_generations ADD CONSTRAINT video_generations_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES video_templates(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Create or replace function to check if column exists (helper for schema refresh script)
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_name = $2
  );
END;
$$;

-- Create or replace function to notify PostgREST to reload schema
CREATE OR REPLACE FUNCTION notify_pgrst_reload()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- Force a schema cache refresh by notifying PostgREST
SELECT notify_pgrst_reload();