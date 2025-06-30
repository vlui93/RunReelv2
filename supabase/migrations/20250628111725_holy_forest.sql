/*
  # Add user_id column to video_generations table

  1. Schema Changes
    - Add `user_id` column to video_generations table
    - Update RLS policies to use user_id for ownership validation
    - Create indexes for better performance

  2. Security
    - Ensure all video generations are properly owned by users
    - Simplify RLS policies using direct user_id comparison
*/

-- Add user_id column to video_generations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN user_id uuid REFERENCES user_profiles(id) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
  END IF;
END $$;

-- Remove the default value after adding the column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' 
    AND column_name = 'user_id' 
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE video_generations ALTER COLUMN user_id DROP DEFAULT;
  END IF;
END $$;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS video_generations_user_id_idx ON video_generations(user_id);

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert video generations for own content" ON video_generations;
DROP POLICY IF EXISTS "Users can read own video generations" ON video_generations;
DROP POLICY IF EXISTS "Users can update own video generations" ON video_generations;
DROP POLICY IF EXISTS "Users can delete own video generations" ON video_generations;

-- Create simplified RLS policies using user_id
CREATE POLICY "Users can insert own video generations"
  ON video_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own video generations"
  ON video_generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own video generations"
  ON video_generations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own video generations"
  ON video_generations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);