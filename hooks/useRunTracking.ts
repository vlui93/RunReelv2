import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from './useAuth';

export interface RunStats {
  distance: number; // km
  duration: number; // seconds
  currentPace: number; // min/km
  averagePace: number; // min/km
  calories: number;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export function useRunTracking() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<RunStats>({
    distance: 0,
    duration: 0,
    currentPace: 0,
    averagePace: 0,
    calories: 0,
  });
  const [routeData, setRouteData] = useState<LocationPoint[]>([]);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request location permissions on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setHasLocationPermission(false);
        return;
      }
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
    })();
  }, []);

  // Start a new run
  const startRun = useCallback(async () => {
    if (!user) return;

    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    setRouteData([]);
    setStats({
      distance: 0,
      duration: 0,
      currentPace: 0,
      averagePace: 0,
      calories: 0,
    });

    // Start timer
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setStats(prev => ({ ...prev, duration: elapsed }));
    }, 1000);
  }, [user]);

  // Pause the run
  const pauseRun = useCallback(() => {
    if (!isRunning || isPaused) return;
    setIsPaused(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning, isPaused]);

  // Resume the run
  const resumeRun = useCallback(async () => {
    if (!isPaused) return;
    setIsPaused(false);

    // Resume timer
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setStats(prev => ({ ...prev, duration: elapsed }));
    }, 1000);
  }, [isPaused]);

  // Stop the run and return data
  const stopRun = useCallback(async () => {
    if (!isRunning) return null;

    setIsRunning(false);
    setIsPaused(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Return run data for the modal
    return {
      distance: stats.distance,
      duration: stats.duration,
      pace: stats.averagePace,
    };
  }, [isRunning, stats]);

  // Save run with additional data from modal
  const saveRun = useCallback(async (additionalData: {
    effortLevel: string;
    mood: number;
  }) => {
    if (!user || stats.distance === 0) return null;

    // Mock save for now - in real app would save to Supabase
    return {
      id: Date.now().toString(),
      distance: stats.distance,
      duration: stats.duration,
      average_pace: stats.averagePace,
      calories: stats.calories,
      effort_level: additionalData.effortLevel,
      mood_rating: additionalData.mood,
    };
  }, [user, stats]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format pace as MM:SS per km
  const formatPace = (pace: number): string => {
    if (!isFinite(pace) || pace <= 0) return '--:--';
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format distance with appropriate decimals
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(2)}km`;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    isRunning,
    isPaused,
    stats,
    hasLocationPermission,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
    saveRun,
    formatTime,
    formatPace,
    formatDistance,
    routeData,
  };
}