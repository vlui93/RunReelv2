import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface MockUserProfile {
  name: string;
  age: number;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  preferred_activities: string[];
  avatar_url: string;
}

interface MockActivityData {
  activity_type: string;
  activity_name: string;
  activity_date: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  distance_km?: number;
  calories_burned?: number;
  average_heart_rate?: number;
  intensity_level: number;
  notes?: string;
  achievement_flags?: string[];
  weather_conditions?: string;
}

export function useMockDataGenerator() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const mockUserProfiles: MockUserProfile[] = [
    {
      name: "Sarah Johnson",
      age: 28,
      fitness_level: "intermediate",
      preferred_activities: ["Running", "Yoga"],
      avatar_url: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
    },
    {
      name: "Mike Chen",
      age: 34,
      fitness_level: "advanced",
      preferred_activities: ["Cycling", "Strength Training"],
      avatar_url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
    },
    {
      name: "Emma Rodriguez",
      age: 25,
      fitness_level: "beginner",
      preferred_activities: ["Walking", "Swimming"],
      avatar_url: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
    },
    {
      name: "David Kim",
      age: 31,
      fitness_level: "intermediate",
      preferred_activities: ["Running", "Cycling"],
      avatar_url: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
    },
    {
      name: "Lisa Thompson",
      age: 29,
      fitness_level: "advanced",
      preferred_activities: ["Strength Training", "Yoga"],
      avatar_url: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
    }
  ];

  const weatherConditions = ['Sunny', 'Cloudy', 'Rainy', 'Windy'];
  const achievementTypes = ['Personal Record', 'First Time Activity', 'Longest Duration', 'Fastest Pace'];

  const generateRunningActivity = (profile: MockUserProfile, date: Date): MockActivityData => {
    const distances = [3, 5, 8, 10, 15, 21]; // km
    const baseDistance = distances[Math.floor(Math.random() * distances.length)];
    
    // Adjust distance based on fitness level
    const distanceMultiplier = {
      beginner: 0.7,
      intermediate: 1.0,
      advanced: 1.3
    }[profile.fitness_level];
    
    const distance = Math.round(baseDistance * distanceMultiplier * 100) / 100;
    
    // Generate realistic pace (5:00-8:00 min/km)
    const basePace = 5.5 + Math.random() * 2.5; // minutes per km
    const paceAdjustment = {
      beginner: 1.2,
      intermediate: 1.0,
      advanced: 0.8
    }[profile.fitness_level];
    
    const pace = basePace * paceAdjustment;
    const durationMinutes = distance * pace;
    const durationSeconds = Math.floor(durationMinutes * 60);
    
    // Calculate calories (rough estimate)
    const calories = Math.floor(distance * 65 * (profile.age / 30));
    
    // Generate heart rate
    const baseHeartRate = 150;
    const heartRateVariation = Math.floor(Math.random() * 30) - 15;
    const heartRate = baseHeartRate + heartRateVariation;
    
    // Generate start time (early morning or evening)
    const isEarlyRun = Math.random() > 0.5;
    const startHour = isEarlyRun ? 6 + Math.floor(Math.random() * 3) : 17 + Math.floor(Math.random() * 3);
    const startMinute = Math.floor(Math.random() * 60);
    
    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0);
    
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
    
    const runningNames = [
      "Morning Run",
      "Evening Jog",
      "Park Loop",
      "Trail Run",
      "Speed Training",
      "Long Distance Run",
      "Recovery Run"
    ];
    
    const achievementFlags: string[] = [];
    if (Math.random() > 0.8) {
      achievementFlags.push(achievementTypes[Math.floor(Math.random() * achievementTypes.length)]);
    }
    
    return {
      activity_type: "Running",
      activity_name: runningNames[Math.floor(Math.random() * runningNames.length)],
      activity_date: date.toISOString().split('T')[0],
      start_time: startTime.toTimeString().slice(0, 8),
      end_time: endTime.toTimeString().slice(0, 8),
      duration_seconds: durationSeconds,
      distance_km: distance,
      calories_burned: calories,
      average_heart_rate: heartRate,
      intensity_level: Math.floor(Math.random() * 5) + 1,
      notes: Math.random() > 0.7 ? "Great workout! Feeling strong." : undefined,
      achievement_flags: achievementFlags.length > 0 ? achievementFlags : undefined,
      weather_conditions: weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
    };
  };

  const generateCyclingActivity = (profile: MockUserProfile, date: Date): MockActivityData => {
    const distances = [15, 25, 40, 60, 80]; // km
    const baseDistance = distances[Math.floor(Math.random() * distances.length)];
    
    const distanceMultiplier = {
      beginner: 0.6,
      intermediate: 1.0,
      advanced: 1.4
    }[profile.fitness_level];
    
    const distance = Math.round(baseDistance * distanceMultiplier * 100) / 100;
    
    // Average speed 20-35 km/h
    const speed = 20 + Math.random() * 15;
    const durationHours = distance / speed;
    const durationSeconds = Math.floor(durationHours * 3600);
    
    const calories = Math.floor(distance * 35);
    const heartRate = 130 + Math.floor(Math.random() * 40);
    
    const startHour = 7 + Math.floor(Math.random() * 10);
    const startMinute = Math.floor(Math.random() * 60);
    
    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0);
    
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
    
    const cyclingNames = [
      "Road Cycling",
      "Mountain Bike Ride",
      "City Commute",
      "Weekend Ride",
      "Hill Training",
      "Scenic Route"
    ];
    
    return {
      activity_type: "Cycling",
      activity_name: cyclingNames[Math.floor(Math.random() * cyclingNames.length)],
      activity_date: date.toISOString().split('T')[0],
      start_time: startTime.toTimeString().slice(0, 8),
      end_time: endTime.toTimeString().slice(0, 8),
      duration_seconds: durationSeconds,
      distance_km: distance,
      calories_burned: calories,
      average_heart_rate: heartRate,
      intensity_level: Math.floor(Math.random() * 5) + 1,
      weather_conditions: weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
    };
  };

  const generateStrengthActivity = (profile: MockUserProfile, date: Date): MockActivityData => {
    const durations = [30, 45, 60, 75, 90]; // minutes
    const baseDuration = durations[Math.floor(Math.random() * durations.length)];
    
    const durationMultiplier = {
      beginner: 0.8,
      intermediate: 1.0,
      advanced: 1.2
    }[profile.fitness_level];
    
    const durationMinutes = Math.floor(baseDuration * durationMultiplier);
    const durationSeconds = durationMinutes * 60;
    
    const calories = Math.floor(durationMinutes * 8);
    const heartRate = 120 + Math.floor(Math.random() * 30);
    
    const startHour = 6 + Math.floor(Math.random() * 16);
    const startMinute = Math.floor(Math.random() * 60);
    
    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0);
    
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
    
    const strengthNames = [
      "Upper Body Workout",
      "Leg Day",
      "Full Body Training",
      "Core Workout",
      "Push/Pull Session",
      "Functional Training"
    ];
    
    return {
      activity_type: "Strength Training",
      activity_name: strengthNames[Math.floor(Math.random() * strengthNames.length)],
      activity_date: date.toISOString().split('T')[0],
      start_time: startTime.toTimeString().slice(0, 8),
      end_time: endTime.toTimeString().slice(0, 8),
      duration_seconds: durationSeconds,
      calories_burned: calories,
      average_heart_rate: heartRate,
      intensity_level: Math.floor(Math.random() * 5) + 1,
      notes: Math.random() > 0.8 ? "Increased weights today!" : undefined
    };
  };

  const generateActivitiesForProfile = (profile: MockUserProfile, userId: string): MockActivityData[] => {
    const activities: MockActivityData[] = [];
    const today = new Date();
    
    // Generate 30 days of data
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip some days (rest days)
      if (Math.random() > 0.7) continue;
      
      // 3-5 activities per week
      const activitiesThisDay = Math.random() > 0.6 ? 1 : 0;
      
      for (let j = 0; j < activitiesThisDay; j++) {
        const activityType = profile.preferred_activities[
          Math.floor(Math.random() * profile.preferred_activities.length)
        ];
        
        let activity: MockActivityData;
        
        switch (activityType) {
          case "Running":
            activity = generateRunningActivity(profile, date);
            break;
          case "Cycling":
            activity = generateCyclingActivity(profile, date);
            break;
          case "Strength Training":
            activity = generateStrengthActivity(profile, date);
            break;
          default:
            activity = generateRunningActivity(profile, date);
        }
        
        activities.push({
          ...activity,
          user_id: userId
        } as any);
      }
    }
    
    return activities;
  };

  const generateMockData = async (): Promise<void> => {
    if (!user) return;

    setGenerating(true);
    setProgress(0);

    try {
      // Generate activities for current user
      const randomProfile = mockUserProfiles[Math.floor(Math.random() * mockUserProfiles.length)];
      const activities = generateActivitiesForProfile(randomProfile, user.id);
      
      setProgress(20);

      // Insert activities in batches
      const batchSize = 10;
      for (let i = 0; i < activities.length; i += batchSize) {
        const batch = activities.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('manual_activities')
          .insert(batch);

        if (error) throw error;
        
        setProgress(20 + (i / activities.length) * 70);
      }

      // Generate some social posts
      const recentActivities = activities.slice(0, 5);
      const socialPosts = recentActivities.map(activity => ({
        user_id: user.id,
        activity_id: null, // Will be updated after activity insertion
        post_type: 'achievement',
        content_text: `Just completed a ${activity.activity_name}! ${activity.distance_km ? `${activity.distance_km}km` : ''} ${Math.floor(activity.duration_seconds / 60)} minutes`,
        visibility: 'public'
      }));

      setProgress(90);

      setProgress(100);
      
      console.log(`Generated ${activities.length} mock activities`);
    } catch (error) {
      console.error('Error generating mock data:', error);
      throw error;
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const clearMockData = async (): Promise<void> => {
    if (!user) return;

    try {
      // Delete user's manual activities
      const { error: activitiesError } = await supabase
        .from('manual_activities')
        .delete()
        .eq('user_id', user.id);

      if (activitiesError) throw activitiesError;

      console.log('Mock data cleared successfully');
    } catch (error) {
      console.error('Error clearing mock data:', error);
      throw error;
    }
  };

  return {
    generating,
    progress,
    generateMockData,
    clearMockData,
    mockUserProfiles,
  };
}