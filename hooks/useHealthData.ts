import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface HealthDataSource {
  id: string;
  source_type: 'apple_health' | 'google_fit' | 'manual';
  is_connected: boolean;
  last_sync_at: string | null;
}

export function useHealthData() {
  const { user } = useAuth();
  const [healthSources, setHealthSources] = useState<HealthDataSource[]>([]);
  const [importedWorkouts, setImportedWorkouts] = useState([]);

  useEffect(() => {
    if (user) {
      // Initialize with mock data for now
      setHealthSources([
        {
          id: '1',
          source_type: 'apple_health',
          is_connected: false,
          last_sync_at: null,
        },
        {
          id: '2',
          source_type: 'google_fit',
          is_connected: false,
          last_sync_at: null,
        },
      ]);
    }
  }, [user]);

  const getConnectedSources = () => {
    return healthSources.filter(source => source.is_connected);
  };

  const getWorkoutStats = () => {
    return {
      totalWorkouts: 0,
      totalDistance: 0,
      totalDuration: 0,
      totalCalories: 0,
    };
  };

  const refreshData = async () => {
    // Mock function for now
    return Promise.resolve();
  };

  return {
    healthSources,
    importedWorkouts,
    getConnectedSources,
    getWorkoutStats,
    refreshData,
  };
}