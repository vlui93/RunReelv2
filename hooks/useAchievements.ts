import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Achievement {
  id: string;
  achievement_type: 'personal_record' | 'milestone' | 'streak' | 'first_time';
  category: 'distance' | 'duration' | 'pace' | 'consistency' | 'calories' | 'frequency';
  value: number;
  description: string;
  is_processed: boolean;
  created_at: string;
}

interface AchievementStats {
  totalAchievements: number;
  personalRecords: number;
  milestones: number;
  streaks: number;
  unprocessedCount: number;
  recentAchievements: Achievement[];
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AchievementStats>({
    totalAchievements: 0,
    personalRecords: 0,
    milestones: 0,
    streaks: 0,
    unprocessedCount: 0,
    recentAchievements: []
  });

  useEffect(() => {
    if (user) {
      // Mock achievements for now
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          achievement_type: 'first_time',
          category: 'frequency',
          value: 1,
          description: 'First run completed!',
          is_processed: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          achievement_type: 'milestone',
          category: 'distance',
          value: 5000,
          description: 'First 5K completed! 🎉',
          is_processed: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      setAchievements(mockAchievements);
      calculateStats(mockAchievements);
      setLoading(false);
    } else {
      setAchievements([]);
      setStats({
        totalAchievements: 0,
        personalRecords: 0,
        milestones: 0,
        streaks: 0,
        unprocessedCount: 0,
        recentAchievements: []
      });
      setLoading(false);
    }
  }, [user]);

  const calculateStats = (achievementData: Achievement[]) => {
    const totalAchievements = achievementData.length;
    const personalRecords = achievementData.filter(a => a.achievement_type === 'personal_record').length;
    const milestones = achievementData.filter(a => a.achievement_type === 'milestone').length;
    const streaks = achievementData.filter(a => a.achievement_type === 'streak').length;
    const unprocessedCount = achievementData.filter(a => !a.is_processed).length;
    const recentAchievements = achievementData.slice(0, 5);

    setStats({
      totalAchievements,
      personalRecords,
      milestones,
      streaks,
      unprocessedCount,
      recentAchievements
    });
  };

  return {
    achievements,
    loading,
    stats,
  };
}