/*
  # Add Video Analytics and Social Features

  1. New Tables
    - `video_analytics`
      - `id` (uuid, primary key)
      - `video_generation_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `event_type` (text: view, like, share, download)
      - `platform` (text: twitter, instagram, tiktok, native)
      - `created_at` (timestamp)
    
    - `video_likes`
      - `id` (uuid, primary key)
      - `video_generation_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `video_comments`
      - `id` (uuid, primary key)
      - `video_generation_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `comment_text` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
    - Track engagement metrics securely
*/

-- Create video analytics table
CREATE TABLE IF NOT EXISTS video_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_generation_id uuid REFERENCES video_generations(id) NOT NULL,
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('view', 'like', 'share', 'download', 'comment')),
  platform text CHECK (platform IN ('twitter', 'instagram', 'tiktok', 'native', 'web')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create video likes table
CREATE TABLE IF NOT EXISTS video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_generation_id uuid REFERENCES video_generations(id) NOT NULL,
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(video_generation_id, user_id)
);

-- Create video comments table
CREATE TABLE IF NOT EXISTS video_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_generation_id uuid REFERENCES video_generations(id) NOT NULL,
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

-- Policies for video_analytics
CREATE POLICY "Users can insert own analytics"
  ON video_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read analytics for their videos"
  ON video_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_generations vg
      JOIN runs r ON r.id = vg.run_id
      WHERE vg.id = video_analytics.video_generation_id 
      AND r.user_id = auth.uid()
    )
  );

-- Policies for video_likes
CREATE POLICY "Users can manage their own likes"
  ON video_likes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all likes"
  ON video_likes
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for video_comments
CREATE POLICY "Users can manage their own comments"
  ON video_comments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all comments"
  ON video_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS video_analytics_video_id_idx ON video_analytics(video_generation_id);
CREATE INDEX IF NOT EXISTS video_analytics_user_id_idx ON video_analytics(user_id);
CREATE INDEX IF NOT EXISTS video_analytics_event_type_idx ON video_analytics(event_type);
CREATE INDEX IF NOT EXISTS video_analytics_created_at_idx ON video_analytics(created_at);

CREATE INDEX IF NOT EXISTS video_likes_video_id_idx ON video_likes(video_generation_id);
CREATE INDEX IF NOT EXISTS video_likes_user_id_idx ON video_likes(user_id);

CREATE INDEX IF NOT EXISTS video_comments_video_id_idx ON video_comments(video_generation_id);
CREATE INDEX IF NOT EXISTS video_comments_user_id_idx ON video_comments(user_id);
CREATE INDEX IF NOT EXISTS video_comments_created_at_idx ON video_comments(created_at);

-- Add view count function
CREATE OR REPLACE FUNCTION get_video_stats(video_gen_id uuid)
RETURNS TABLE(
  view_count bigint,
  like_count bigint,
  share_count bigint,
  comment_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*) FROM video_analytics WHERE video_generation_id = video_gen_id AND event_type = 'view'), 0) as view_count,
    COALESCE((SELECT COUNT(*) FROM video_likes WHERE video_generation_id = video_gen_id), 0) as like_count,
    COALESCE((SELECT COUNT(*) FROM video_analytics WHERE video_generation_id = video_gen_id AND event_type = 'share'), 0) as share_count,
    COALESCE((SELECT COUNT(*) FROM video_comments WHERE video_generation_id = video_gen_id), 0) as comment_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;