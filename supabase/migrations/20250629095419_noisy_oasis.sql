/*
  # Remove Social Features and Clean Up Database

  1. Drop Tables
    - Remove social_posts table and related functionality
    - Remove post_interactions table and related functionality
    - Clean up associated functions, triggers, and policies

  2. Keep Core Tables
    - manual_activities (with proper constraints)
    - api_usage_tracking (with usage limits)
    - Maintain existing RLS policies for core functionality

  3. Security
    - Maintain RLS on remaining tables
    - Keep API usage tracking for video generation limits
*/

-- Drop social-related tables if they exist
DROP TABLE IF EXISTS post_interactions CASCADE;
DROP TABLE IF EXISTS social_posts CASCADE;

-- Drop social-related functions if they exist
DROP FUNCTION IF EXISTS update_engagement_stats(uuid);
DROP FUNCTION IF EXISTS trigger_update_engagement_stats();

-- Ensure manual_activities table has proper structure
CREATE TABLE IF NOT EXISTS manual_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  activity_type text NOT NULL,
  activity_name text NOT NULL,
  activity_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_seconds integer NOT NULL,
  distance_km decimal(8,3),
  calories_burned integer,
  average_heart_rate integer,
  intensity_level integer CHECK (intensity_level BETWEEN 1 AND 5),
  notes text,
  achievement_flags text[],
  weather_conditions text,
  video_generated boolean DEFAULT false,
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure api_usage_tracking table has proper structure
CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  api_service text NOT NULL,
  request_type text NOT NULL,
  request_timestamp timestamptz DEFAULT now(),
  response_status text,
  cost_estimate decimal(10,4),
  request_payload jsonb,
  response_data jsonb
);

-- Enable Row Level Security
ALTER TABLE manual_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can manage own activities" ON manual_activities;
DROP POLICY IF EXISTS "Users can view their own activities" ON manual_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON manual_activities;

DROP POLICY IF EXISTS "Users can read own API usage" ON api_usage_tracking;
DROP POLICY IF EXISTS "System can insert API usage" ON api_usage_tracking;
DROP POLICY IF EXISTS "Users can insert their own API usage" ON api_usage_tracking;
DROP POLICY IF EXISTS "Users can view their own API usage" ON api_usage_tracking;

-- Policies for manual_activities
CREATE POLICY "Users can manage own activities"
  ON manual_activities
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own activities"
  ON manual_activities
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON manual_activities
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- Policies for api_usage_tracking
CREATE POLICY "Users can read own API usage"
  ON api_usage_tracking
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert API usage"
  ON api_usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own API usage"
  ON api_usage_tracking
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API usage"
  ON api_usage_tracking
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- Add constraints for manual_activities
DO $$
BEGIN
  -- Drop existing constraints if they exist
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'manual_activities_activity_type_check') THEN
    ALTER TABLE manual_activities DROP CONSTRAINT manual_activities_activity_type_check;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'manual_activities_calories_check') THEN
    ALTER TABLE manual_activities DROP CONSTRAINT manual_activities_calories_check;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'manual_activities_heart_rate_check') THEN
    ALTER TABLE manual_activities DROP CONSTRAINT manual_activities_heart_rate_check;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'manual_activities_weather_check') THEN
    ALTER TABLE manual_activities DROP CONSTRAINT manual_activities_weather_check;
  END IF;
END $$;

-- Add constraints
ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_activity_type_check 
  CHECK (activity_type IN ('Running', 'Walking', 'Cycling', 'Swimming', 'Strength Training', 'Yoga', 'Other'));

ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_calories_check 
  CHECK (calories_burned IS NULL OR (calories_burned >= 50 AND calories_burned <= 2000));

ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_heart_rate_check 
  CHECK (average_heart_rate IS NULL OR (average_heart_rate >= 60 AND average_heart_rate <= 200));

ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_weather_check 
  CHECK (weather_conditions IS NULL OR weather_conditions IN ('Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snow'));

-- Add constraints for api_usage_tracking
DO $$
BEGIN
  -- Drop existing constraints if they exist
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'api_usage_service_check') THEN
    ALTER TABLE api_usage_tracking DROP CONSTRAINT api_usage_service_check;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'api_usage_request_type_check') THEN
    ALTER TABLE api_usage_tracking DROP CONSTRAINT api_usage_request_type_check;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'api_usage_status_check') THEN
    ALTER TABLE api_usage_tracking DROP CONSTRAINT api_usage_status_check;
  END IF;
END $$;

ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_service_check 
  CHECK (api_service IN ('tavus'));

ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_request_type_check 
  CHECK (request_type IN ('video_generation'));

ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_status_check 
  CHECK (response_status IN ('success', 'error', 'pending'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS manual_activities_user_id_idx ON manual_activities(user_id);
CREATE INDEX IF NOT EXISTS manual_activities_date_idx ON manual_activities(activity_date);
CREATE INDEX IF NOT EXISTS manual_activities_type_idx ON manual_activities(activity_type);
CREATE INDEX IF NOT EXISTS manual_activities_created_at_idx ON manual_activities(created_at);

CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS api_usage_service_idx ON api_usage_tracking(api_service);
CREATE INDEX IF NOT EXISTS api_usage_timestamp_idx ON api_usage_tracking(request_timestamp);

-- Function to check API usage limits
CREATE OR REPLACE FUNCTION check_video_generation_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  usage_count integer;
BEGIN
  SELECT COUNT(*) INTO usage_count
  FROM api_usage_tracking
  WHERE user_id = p_user_id
    AND api_service = 'tavus'
    AND request_type = 'video_generation'
    AND response_status = 'success';
  
  RETURN usage_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;