import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface ManualActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_name: string;
  activity_date: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  distance_km?: number;
  calories_burned?: number;
  average_heart_rate?: number;
  intensity_level?: number;
  notes?: string;
  achievement_flags?: string[];
  weather_conditions?: string;
  video_generated: boolean;
  video_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityFormData {
  activity_type: string;
  activity_name: string;
  activity_date: Date;
  start_time: Date;
  end_time: Date;
  distance_km?: number;
  calories_burned?: number;
  average_heart_rate?: number;
  intensity_level?: number;
  notes?: string;
  achievement_flags?: string[];
  weather_conditions?: string;
}

export function useManualActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ManualActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchActivities();
    } else {
      setActivities([]);
      setLoading(false);
    }
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('manual_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('activity_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (formData: ActivityFormData): Promise<ManualActivity | null> => {
    if (!user) return null;

    setSubmitting(true);
    try {
      // Calculate duration in seconds
      const startTime = formData.start_time;
      const endTime = formData.end_time;
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationSeconds = Math.floor(durationMs / 1000);

      // Format time strings
      const startTimeStr = startTime.toTimeString().slice(0, 8);
      const endTimeStr = endTime.toTimeString().slice(0, 8);

      const activityData = {
        user_id: user.id,
        activity_type: formData.activity_type,
        activity_name: formData.activity_name,
        activity_date: formData.activity_date.toISOString().split('T')[0],
        start_time: startTimeStr,
        end_time: endTimeStr,
        duration_seconds: durationSeconds,
        distance_km: formData.distance_km,
        calories_burned: formData.calories_burned,
        average_heart_rate: formData.average_heart_rate,
        intensity_level: formData.intensity_level,
        notes: formData.notes,
        achievement_flags: formData.achievement_flags || [],
        weather_conditions: formData.weather_conditions,
      };

      const { data, error } = await supabase
        .from('manual_activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;

      // Refresh activities list
      await fetchActivities();
      
      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const getActivityStats = () => {
    const totalActivities = activities.length;
    const totalDistance = activities.reduce((sum, activity) => sum + (activity.distance_km || 0), 0);
    const totalDuration = activities.reduce((sum, activity) => sum + activity.duration_seconds, 0);
    const totalCalories = activities.reduce((sum, activity) => sum + (activity.calories_burned || 0), 0);
    const videosGenerated = activities.filter(activity => activity.video_generated).length;

    const activityTypes = activities.reduce((acc, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActivities,
      totalDistance,
      totalDuration: Math.floor(totalDuration / 60), // Convert to minutes
      totalCalories,
      videosGenerated,
      activityTypes,
    };
  };

  return {
    activities,
    loading,
    submitting,
    createActivity,
    fetchActivities,
    getActivityStats,
  };
}