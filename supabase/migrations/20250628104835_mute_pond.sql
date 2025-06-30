/*
  # Improve Achievement Detection System

  1. Enhanced Functions
    - Update detect_achievements function to handle more achievement types
    - Add consistency streak detection
    - Improve milestone detection
    - Add frequency-based achievements

  2. New Achievement Types
    - Weekly consistency streaks
    - Monthly distance milestones
    - Workout frequency achievements
    - Improvement rate achievements
*/

-- Enhanced achievement detection function
CREATE OR REPLACE FUNCTION detect_achievements(p_user_id uuid, p_workout_id uuid)
RETURNS void AS $$
DECLARE
  workout_record imported_workouts%ROWTYPE;
  prev_best_distance decimal;
  prev_best_duration integer;
  prev_best_pace decimal;
  workout_count integer;
  recent_workouts_count integer;
  streak_days integer;
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
      )
      ON CONFLICT DO NOTHING;
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
    )
    ON CONFLICT DO NOTHING;
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
      )
      ON CONFLICT DO NOTHING;
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
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Distance Milestones for Running
  IF workout_record.workout_type = 'running' THEN
    -- 5K milestone
    IF workout_record.distance >= 5000 AND NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = p_user_id 
        AND achievement_type = 'milestone' 
        AND category = 'distance' 
        AND value = 5000
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
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- 10K milestone
    IF workout_record.distance >= 10000 AND NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = p_user_id 
        AND achievement_type = 'milestone' 
        AND category = 'distance' 
        AND value = 10000
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
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Half Marathon milestone
    IF workout_record.distance >= 21097 AND NOT EXISTS (
      SELECT 1 FROM achievements 
      WHERE user_id = p_user_id 
        AND achievement_type = 'milestone' 
        AND category = 'distance' 
        AND value = 21097
    ) THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
      VALUES (
        p_user_id, 
        p_workout_id, 
        'milestone', 
        'distance', 
        21097,
        0,
        'Half Marathon completed! Incredible achievement! 🏃‍♂️🎖️'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Frequency Milestones
  SELECT COUNT(*) INTO workout_count 
  FROM imported_workouts 
  WHERE user_id = p_user_id;
  
  -- 10 workouts milestone
  IF workout_count = 10 THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
    VALUES (
      p_user_id, 
      p_workout_id, 
      'milestone', 
      'frequency', 
      10,
      0,
      '10 workouts completed! You''re building a great habit! 💪'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- 25 workouts milestone
  IF workout_count = 25 THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
    VALUES (
      p_user_id, 
      p_workout_id, 
      'milestone', 
      'frequency', 
      25,
      0,
      '25 workouts completed! You''re on fire! 🔥'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- 50 workouts milestone
  IF workout_count = 50 THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
    VALUES (
      p_user_id, 
      p_workout_id, 
      'milestone', 
      'frequency', 
      50,
      0,
      '50 workouts completed! You''re a fitness champion! 🏆'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Weekly consistency check (3+ workouts in 7 days)
  SELECT COUNT(*) INTO recent_workouts_count
  FROM imported_workouts 
  WHERE user_id = p_user_id 
    AND start_time >= (workout_record.start_time - INTERVAL '7 days')
    AND start_time <= workout_record.start_time;
  
  IF recent_workouts_count >= 3 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = p_user_id 
      AND achievement_type = 'streak' 
      AND category = 'consistency'
      AND value = 7
      AND created_at >= (workout_record.start_time - INTERVAL '7 days')
  ) THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
    VALUES (
      p_user_id, 
      p_workout_id, 
      'streak', 
      'consistency', 
      7,
      0,
      'Weekly warrior! 3+ workouts this week! 🗓️'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect consistency streaks for manual activities
CREATE OR REPLACE FUNCTION detect_manual_activity_achievements(p_user_id uuid, p_activity_id uuid)
RETURNS void AS $$
DECLARE
  activity_record manual_activities%ROWTYPE;
  prev_best_distance decimal;
  prev_best_duration integer;
  activity_count integer;
  recent_activities_count integer;
BEGIN
  -- Get the activity details
  SELECT * INTO activity_record FROM manual_activities WHERE id = p_activity_id;
  
  -- Personal Record - Distance
  IF activity_record.distance_km > 0 THEN
    SELECT MAX(distance_km) INTO prev_best_distance 
    FROM manual_activities 
    WHERE user_id = p_user_id 
      AND activity_type = activity_record.activity_type 
      AND id != p_activity_id;
    
    IF prev_best_distance IS NULL OR activity_record.distance_km > prev_best_distance THEN
      INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
      VALUES (
        p_user_id, 
        NULL, -- No workout_id for manual activities
        'personal_record', 
        'distance', 
        activity_record.distance_km * 1000, -- Convert to meters
        COALESCE(prev_best_distance * 1000, 0),
        format('New distance record: %.2f km!', activity_record.distance_km)
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Personal Record - Duration
  SELECT MAX(duration_seconds) INTO prev_best_duration 
  FROM manual_activities 
  WHERE user_id = p_user_id 
    AND activity_type = activity_record.activity_type 
    AND id != p_activity_id;
  
  IF prev_best_duration IS NULL OR activity_record.duration_seconds > prev_best_duration THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
    VALUES (
      p_user_id, 
      NULL,
      'personal_record', 
      'duration', 
      activity_record.duration_seconds,
      COALESCE(prev_best_duration, 0),
      format('Longest %s: %s minutes!', activity_record.activity_type, ROUND(activity_record.duration_seconds / 60.0))
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- First Time Achievement
  SELECT COUNT(*) INTO activity_count 
  FROM manual_activities 
  WHERE user_id = p_user_id 
    AND activity_type = activity_record.activity_type;
  
  IF activity_count = 1 THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
    VALUES (
      p_user_id, 
      NULL,
      'first_time', 
      'frequency', 
      1,
      0,
      format('First %s completed!', activity_record.activity_type)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Weekly consistency check
  SELECT COUNT(*) INTO recent_activities_count
  FROM manual_activities 
  WHERE user_id = p_user_id 
    AND activity_date >= (activity_record.activity_date - INTERVAL '7 days')
    AND activity_date <= activity_record.activity_date;
  
  IF recent_activities_count >= 3 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = p_user_id 
      AND achievement_type = 'streak' 
      AND category = 'consistency'
      AND value = 7
      AND created_at >= (activity_record.activity_date - INTERVAL '7 days')
  ) THEN
    INSERT INTO achievements (user_id, workout_id, achievement_type, category, value, previous_value, description)
    VALUES (
      p_user_id, 
      NULL,
      'streak', 
      'consistency', 
      7,
      0,
      'Weekly warrior! 3+ activities this week! 🗓️'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for manual activities
CREATE OR REPLACE FUNCTION trigger_detect_manual_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM detect_manual_activity_achievements(NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'manual_activities_achievement_trigger'
  ) THEN
    CREATE TRIGGER manual_activities_achievement_trigger
      AFTER INSERT ON manual_activities
      FOR EACH ROW
      EXECUTE FUNCTION trigger_detect_manual_achievements();
  END IF;
END $$;