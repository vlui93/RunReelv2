/*
  # Health Data Import and Enhanced Video System

  1. New Tables
    - `health_data_sources`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `source_type` (text: apple_health, google_fit, manual)
      - `is_connected` (boolean)
      - `last_sync_at` (timestamp)
      - `sync_status` (text)
      - `permissions_granted` (jsonb)
      - `created_at` (timestamp)
    
    - `imported_workouts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `source_id` (uuid, foreign key to health_data_sources)
      - `external_id` (text, unique per source)
      - `workout_type` (text: running, walking, cycling, strength, etc.)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `distance` (decimal, meters)
      - `duration` (integer, seconds)
      - `calories` (integer)
      - `heart_rate_avg` (integer)
      - `heart_rate_max` (integer)
      - `pace_avg` (decimal, min/km)
      - `elevation_gain` (decimal, meters)
      - `route_data` (jsonb, GPS coordinates)
      - `metadata` (jsonb, additional source-specific data)
      - `created_at` (timestamp)
    
    - `achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `workout_id` (uuid, foreign key to imported_workouts)
      - `achievement_type` (text: personal_record, milestone, streak, first_time)
      - `category` (text: distance, duration, pace, consistency)
      - `value` (decimal, achievement value)
      - `previous_value` (decimal, previous best)
      - `description` (text, human-readable description)
      - `is_processed` (boolean, for video generation)
      - `created_at` (timestamp)
    
    - `video_templates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `workout_types` (text[], applicable workout types)
      - `achievement_types` (text[], applicable achievement types)
      - `template_config` (jsonb, Tavus template configuration)
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Enhanced Tables
    - Update `video_generations` with new fields
    - Update `runs` table to link with imported workouts

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Create health_data_sources table
CREATE TABLE IF NOT EXISTS health_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('apple_health', 'google_fit', 'manual')),
  is_connected boolean DEFAULT false,
  last_sync_at timestamptz,
  sync_status text DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  permissions_granted jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, source_type)
);

-- Create imported_workouts table
CREATE TABLE IF NOT EXISTS imported_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  source_id uuid REFERENCES health_data_sources(id) NOT NULL,
  external_id text NOT NULL,
  workout_type text NOT NULL CHECK (workout_type IN ('running', 'walking', 'cycling', 'swimming', 'strength', 'yoga', 'hiking', 'other')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  distance decimal DEFAULT 0,
  duration integer NOT NULL,
  calories integer DEFAULT 0,
  heart_rate_avg integer,
  heart_rate_max integer,
  pace_avg decimal,
  elevation_gain decimal DEFAULT 0,
  route_data jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_id, external_id)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  workout_id uuid REFERENCES imported_workouts(id),
  achievement_type text NOT NULL CHECK (achievement_type IN ('personal_record', 'milestone', 'streak', 'first_time')),
  category text NOT NULL CHECK (category IN ('distance', 'duration', 'pace', 'consistency', 'calories', 'frequency')),
  value decimal NOT NULL,
  previous_value decimal,
  description text NOT NULL,
  is_processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create video_templates table
CREATE TABLE IF NOT EXISTS video_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  workout_types text[] NOT NULL,
  achievement_types text[] NOT NULL,
  template_config jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to video_generations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'achievement_id'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN achievement_id uuid REFERENCES achievements(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN template_id uuid REFERENCES video_templates(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'video_format'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN video_format text DEFAULT 'square' CHECK (video_format IN ('square', 'vertical', 'horizontal'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_generations' AND column_name = 'generation_config'
  ) THEN
    ALTER TABLE video_generations ADD COLUMN generation_config jsonb DEFAULT '{}';
  END IF;
END $$;

-- Add link between runs and imported_workouts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'imported_workout_id'
  ) THEN
    ALTER TABLE runs ADD COLUMN imported_workout_id uuid REFERENCES imported_workouts(id);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE health_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;

-- Policies for health_data_sources
CREATE POLICY "Users can manage own health data sources"
  ON health_data_sources
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for imported_workouts
CREATE POLICY "Users can read own imported workouts"
  ON imported_workouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own imported workouts"
  ON imported_workouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own imported workouts"
  ON imported_workouts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for achievements
CREATE POLICY "Users can read own achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON achievements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for video_templates (read-only for users)
CREATE POLICY "Users can read video templates"
  ON video_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS health_data_sources_user_id_idx ON health_data_sources(user_id);
CREATE INDEX IF NOT EXISTS health_data_sources_source_type_idx ON health_data_sources(source_type);

CREATE INDEX IF NOT EXISTS imported_workouts_user_id_idx ON imported_workouts(user_id);
CREATE INDEX IF NOT EXISTS imported_workouts_source_id_idx ON imported_workouts(source_id);
CREATE INDEX IF NOT EXISTS imported_workouts_workout_type_idx ON imported_workouts(workout_type);
CREATE INDEX IF NOT EXISTS imported_workouts_start_time_idx ON imported_workouts(start_time);
CREATE INDEX IF NOT EXISTS imported_workouts_external_id_idx ON imported_workouts(source_id, external_id);

CREATE INDEX IF NOT EXISTS achievements_user_id_idx ON achievements(user_id);
CREATE INDEX IF NOT EXISTS achievements_workout_id_idx ON achievements(workout_id);
CREATE INDEX IF NOT EXISTS achievements_type_idx ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS achievements_processed_idx ON achievements(is_processed);

-- Insert default video templates
INSERT INTO video_templates (name, workout_types, achievement_types, template_config) VALUES
('Running Achievement', ARRAY['running'], ARRAY['personal_record', 'milestone'], '{"style": "energetic", "background": "running_track", "voice": "motivational"}'),
('Cycling Victory', ARRAY['cycling'], ARRAY['personal_record', 'milestone'], '{"style": "adventure", "background": "mountain_road", "voice": "encouraging"}'),
('Walking Milestone', ARRAY['walking'], ARRAY['milestone', 'streak'], '{"style": "peaceful", "background": "nature_path", "voice": "calm"}'),
('First Time Achievement', ARRAY['running', 'cycling', 'walking'], ARRAY['first_time'], '{"style": "celebration", "background": "confetti", "voice": "excited"}'),
('Consistency Streak', ARRAY['running', 'cycling', 'walking', 'strength'], ARRAY['streak'], '{"style": "determination", "background": "calendar", "voice": "proud"}')
ON CONFLICT DO NOTHING;

-- Function to detect achievements
CREATE OR REPLACE FUNCTION detect_achievements(p_user_id uuid, p_workout_id uuid)
RETURNS void AS $$
DECLARE
  workout_record imported_workouts%ROWTYPE;
  prev_best_distance decimal;
  prev_best_duration integer;
  prev_best_pace decimal;
  workout_count integer;
BEGIN
  -- Get the workout details
  SELECT * INTO workout_record FROM imported_workouts WHERE id = p_workout_id;
  
  -- Personal Record - Distance
  IF workout_record.distance > 0 THEN
    SELECT MAX(distance) INTO prev_best_distance 
    FROM imported_workouts 
    WHERE user_id = p_user_id 
      AND workout_type = workout_record.workout_type 
      AND id != p_workout_id;
    
    IF prev_best_distance IS NULL OR workout_record.distance > prev_best_distance THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
      VALUES (
        p_user_id, 
        p_workout_id, 
        'personal_record', 
        'distance', 
        workout_record.distance,
        COALESCE(prev_best_distance, 0),
        format('New distance record: %.2f km!', workout_record.distance / 1000)
      );
    END IF;
  END IF;
  
  -- Personal Record - Duration (longest workout)
  SELECT MAX(duration) INTO prev_best_duration 
  FROM imported_workouts 
  WHERE user_id = p_user_id 
    AND workout_type = workout_record.workout_type 
    AND id != p_workout_id;
  
  IF prev_best_duration IS NULL OR workout_record.duration > prev_best_duration THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
    VALUES (
      p_user_id, 
      p_workout_id, 
      'personal_record', 
      'duration', 
      workout_record.duration,
      COALESCE(prev_best_duration, 0),
      format('Longest workout: %s minutes!', ROUND(workout_record.duration / 60.0))
    );
  END IF;
  
  -- Personal Record - Best Pace (fastest)
  IF workout_record.pace_avg > 0 THEN
    SELECT MIN(pace_avg) INTO prev_best_pace 
    FROM imported_workouts 
    WHERE user_id = p_user_id 
      AND workout_type = workout_record.workout_type 
      AND pace_avg > 0
      AND id != p_workout_id;
    
    IF prev_best_pace IS NULL OR workout_record.pace_avg < prev_best_pace THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
      VALUES (
        p_user_id, 
        p_workout_id, 
        'personal_record', 
        'pace', 
        workout_record.pace_avg,
        COALESCE(prev_best_pace, 0),
        format('New pace record: %s min/km!', TO_CHAR(workout_record.pace_avg, 'FM9.99'))
      );
    END IF;
  END IF;
  
  -- First Time Achievement
  SELECT COUNT(*) INTO workout_count 
  FROM imported_workouts 
  WHERE user_id = p_user_id 
    AND workout_type = workout_record.workout_type;
  
  IF workout_count = 1 THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
    VALUES (
      p_user_id, 
      p_workout_id, 
      'first_time', 
      'frequency', 
      1,
      0,
      format('First %s workout completed!', workout_record.workout_type)
    );
  END IF;
  
  -- Milestone Achievements
  IF workout_record.workout_type = 'running' AND workout_record.distance >= 5000 THEN
    -- Check if this is their first 5K
    IF NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = p_user_id 
        AND achievement_type = 'milestone' 
        AND category = 'distance' 
        AND value = 5000
        AND id != (SELECT id FROM achievements WHERE workout_id = p_workout_id AND category = 'distance' LIMIT 1)
    ) THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
      VALUES (
        p_user_id, 
        p_workout_id, 
        'milestone', 
        'distance', 
        5000,
        0,
        'First 5K completed! 🎉'
      );
    END IF;
  END IF;
  
  IF workout_record.workout_type = 'running' AND workout_record.distance >= 10000 THEN
    -- Check if this is their first 10K
    IF NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = p_user_id 
        AND achievement_type = 'milestone' 
        AND category = 'distance' 
        AND value = 10000
        AND id != (SELECT id FROM achievements WHERE workout_id = p_workout_id AND category = 'distance' LIMIT 1)
    ) THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
      VALUES (
        p_user_id, 
        p_workout_id, 
        'milestone', 
        'distance', 
        10000,
        0,
        'First 10K completed! Amazing! 🏃‍♂️'
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically detect achievements
CREATE OR REPLACE FUNCTION trigger_detect_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM detect_achievements(NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER imported_workouts_achievement_trigger
  AFTER INSERT ON imported_workouts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_detect_achievements();