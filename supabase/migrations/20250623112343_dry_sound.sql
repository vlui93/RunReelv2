/*
  # Manual Activity Entry System

  1. New Tables
    - `manual_activities`
      - Complete activity entry with all form fields
      - Achievement flags and performance metrics
      - Video generation tracking
    
    - `api_usage_tracking`
      - Track Tavus API usage with strict limits
      - Cost estimation and request monitoring
    
    - `social_posts`
      - Social feed content structure
      - Achievement posts and engagement
    
    - `post_interactions`
      - Like, comment, share functionality
      - Real-time engagement tracking

  2. Security
    - Enable RLS on all tables
    - User-specific data access policies
    - API usage limits enforcement
*/

-- Create manual_activities table
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

-- Create API usage tracking table
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

-- Create social posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  activity_id uuid REFERENCES manual_activities(id),
  post_type text NOT NULL,
  content_text text,
  video_url text,
  image_url text,
  engagement_stats jsonb DEFAULT '{"likes": 0, "comments": 0, "shares": 0}',
  visibility text DEFAULT 'public',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create post interactions table
CREATE TABLE IF NOT EXISTS post_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES social_posts(id) NOT NULL,
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  interaction_type text NOT NULL,
  comment_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, interaction_type)
);

-- Enable Row Level Security
ALTER TABLE manual_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for manual_activities
CREATE POLICY "Users can manage own activities"
  ON manual_activities
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

-- Policies for social_posts
CREATE POLICY "Users can read public posts"
  ON social_posts
  FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can manage own posts"
  ON social_posts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for post_interactions
CREATE POLICY "Users can read all interactions"
  ON post_interactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own interactions"
  ON post_interactions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add constraints
ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_activity_type_check 
  CHECK (activity_type IN ('Running', 'Walking', 'Cycling', 'Swimming', 'Strength Training', 'Yoga', 'Other'));

ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_calories_check 
  CHECK (calories_burned IS NULL OR (calories_burned >= 50 AND calories_burned <= 2000));

ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_heart_rate_check 
  CHECK (average_heart_rate IS NULL OR (average_heart_rate >= 60 AND average_heart_rate <= 200));

ALTER TABLE manual_activities ADD CONSTRAINT manual_activities_weather_check 
  CHECK (weather_conditions IS NULL OR weather_conditions IN ('Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snow'));

ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_service_check 
  CHECK (api_service IN ('tavus'));

ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_request_type_check 
  CHECK (request_type IN ('video_generation'));

ALTER TABLE api_usage_tracking ADD CONSTRAINT api_usage_status_check 
  CHECK (response_status IN ('success', 'error', 'pending'));

ALTER TABLE social_posts ADD CONSTRAINT social_posts_type_check 
  CHECK (post_type IN ('achievement', 'record', 'streak'));

ALTER TABLE social_posts ADD CONSTRAINT social_posts_visibility_check 
  CHECK (visibility IN ('public', 'friends', 'private'));

ALTER TABLE post_interactions ADD CONSTRAINT post_interactions_type_check 
  CHECK (interaction_type IN ('like', 'comment', 'share'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS manual_activities_user_id_idx ON manual_activities(user_id);
CREATE INDEX IF NOT EXISTS manual_activities_date_idx ON manual_activities(activity_date);
CREATE INDEX IF NOT EXISTS manual_activities_type_idx ON manual_activities(activity_type);
CREATE INDEX IF NOT EXISTS manual_activities_created_at_idx ON manual_activities(created_at);

CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS api_usage_service_idx ON api_usage_tracking(api_service);
CREATE INDEX IF NOT EXISTS api_usage_timestamp_idx ON api_usage_tracking(request_timestamp);

CREATE INDEX IF NOT EXISTS social_posts_user_id_idx ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS social_posts_created_at_idx ON social_posts(created_at);
CREATE INDEX IF NOT EXISTS social_posts_visibility_idx ON social_posts(visibility);

CREATE INDEX IF NOT EXISTS post_interactions_post_id_idx ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS post_interactions_user_id_idx ON post_interactions(user_id);

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

-- Function to update engagement stats
CREATE OR REPLACE FUNCTION update_engagement_stats(p_post_id uuid)
RETURNS void AS $$
DECLARE
  like_count integer;
  comment_count integer;
  share_count integer;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE interaction_type = 'like'),
    COUNT(*) FILTER (WHERE interaction_type = 'comment'),
    COUNT(*) FILTER (WHERE interaction_type = 'share')
  INTO like_count, comment_count, share_count
  FROM post_interactions
  WHERE post_id = p_post_id;
  
  UPDATE social_posts
  SET engagement_stats = jsonb_build_object(
    'likes', like_count,
    'comments', comment_count,
    'shares', share_count
  ),
  updated_at = now()
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update engagement stats
CREATE OR REPLACE FUNCTION trigger_update_engagement_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_engagement_stats(COALESCE(NEW.post_id, OLD.post_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_interactions_engagement_trigger
  AFTER INSERT OR UPDATE OR DELETE ON post_interactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_engagement_stats();