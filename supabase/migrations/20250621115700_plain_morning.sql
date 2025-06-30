/*
  # Initial RunReel Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `avatar_url` (text)
      - `created_at` (timestamp)
    
    - `runs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `distance` (decimal, kilometers)
      - `duration` (integer, seconds)
      - `average_pace` (decimal, minutes per km)
      - `calories` (integer, estimated)
      - `route_data` (jsonb, GPS coordinates)
      - `video_url` (text, generated video URL)
      - `created_at` (timestamp)
    
    - `video_generations`
      - `id` (uuid, primary key)
      - `run_id` (uuid, foreign key to runs)
      - `tavus_job_id` (text, Tavus API job identifier)
      - `status` (text, generation status)
      - `video_url` (text, final video URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own runs and video generations
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  username text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create runs table
CREATE TABLE IF NOT EXISTS runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  distance decimal NOT NULL,
  duration integer NOT NULL,
  average_pace decimal,
  calories integer,
  route_data jsonb,
  video_url text,
  created_at timestamptz DEFAULT now()
);

-- Create video_generations table
CREATE TABLE IF NOT EXISTS video_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES runs(id) NOT NULL,
  tavus_job_id text,
  status text DEFAULT 'pending',
  video_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for runs
CREATE POLICY "Users can read own runs"
  ON runs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own runs"
  ON runs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own runs"
  ON runs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for video_generations
CREATE POLICY "Users can read own video generations"
  ON video_generations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM runs 
      WHERE runs.id = video_generations.run_id 
      AND runs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own video generations"
  ON video_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM runs 
      WHERE runs.id = video_generations.run_id 
      AND runs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own video generations"
  ON video_generations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM runs 
      WHERE runs.id = video_generations.run_id 
      AND runs.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS runs_user_id_idx ON runs(user_id);
CREATE INDEX IF NOT EXISTS runs_created_at_idx ON runs(created_at);
CREATE INDEX IF NOT EXISTS video_generations_run_id_idx ON video_generations(run_id);
CREATE INDEX IF NOT EXISTS video_generations_status_idx ON video_generations(status);