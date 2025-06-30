import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useManualActivities } from '@/hooks/useManualActivities';
import { useHealthData } from '@/hooks/useHealthData';
import { useVideoLibrary } from '@/hooks/useVideoLibrary';
import { useAchievements } from '@/hooks/useAchievements';
import { 
  Plus, 
  Trophy, 
  Target, 
  Zap, 
  Calendar,
  TrendingUp,
  Video,
  Settings,
  Smartphone,
  Apple,
  Activity as ActivityIcon
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeTab() {
  const { user, loading: authLoading } = useAuth();
  const { activities, getActivityStats } = useManualActivities();
  const { getConnectedSources, getWorkoutStats } = useHealthData();
  const { getVideoStats } = useVideoLibrary();
  const { stats: achievementStats } = useAchievements();

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIcon size={48} color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.authContent}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg?auto=compress&cs=tinysrgb&w=800' }}
            style={styles.heroImage}
          />
          <Text style={styles.authTitle}>Welcome to RunReel</Text>
          <Text style={styles.authSubtitle}>
            Track your runs, generate AI videos, and celebrate your achievements
          </Text>
          <TouchableOpacity 
            style={styles.authButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.authButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const activityStats = getActivityStats();
  const workoutStats = getWorkoutStats();
  const videoStats = getVideoStats();
  const connectedSources = getConnectedSources();

  const totalActivities = activityStats.totalActivities + workoutStats.totalWorkouts;
  const totalDistance = activityStats.totalDistance + workoutStats.totalDistance;
  const totalDuration = activityStats.totalDuration + workoutStats.totalDuration;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{greeting}!</Text>
            <Text style={styles.username}>{user.user_metadata?.username || 'Runner'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.primaryAction}
          onPress={() => router.push('/manual-entry')}
        >
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.primaryActionGradient}
          >
            <Plus size={24} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Log Activity</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity 
            style={styles.secondaryAction}
            onPress={() => router.push('/achievements')}
          >
            <Trophy size={20} color="#F59E0B" />
            <Text style={styles.secondaryActionText}>Achievements</Text>
            {achievementStats.unprocessedCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{achievementStats.unprocessedCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryAction}
            onPress={() => router.push('/(tabs)/videos')}
          >
            <Video size={20} color="#8B5CF6" />
            <Text style={styles.secondaryActionText}>My Videos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Target size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{totalActivities}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#10B981" />
            <Text style={styles.statValue}>{totalDistance.toFixed(1)}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Zap size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{Math.floor(totalDuration / 60)}h</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color="#EF4444" />
            <Text style={styles.statValue}>{videoStats.completedVideos}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/activity')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {activities.length > 0 ? (
          <View style={styles.activitiesList}>
            {activities.slice(0, 3).map((activity) => (
              <TouchableOpacity 
                key={activity.id}
                style={styles.activityCard}
                onPress={() => router.push({
                  pathname: '/activity-details',
                  params: { activityId: activity.id, activityType: 'manual' }
                })}
              >
                <View style={styles.activityIcon}>
                  <ActivityIcon size={20} color="#3B82F6" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityName}>{activity.activity_name}</Text>
                  <Text style={styles.activityDetails}>
                    {activity.distance_km ? `${activity.distance_km}km • ` : ''}
                    {Math.floor(activity.duration_seconds / 60)} min
                  </Text>
                </View>
                <View style={styles.activityDate}>
                  <Calendar size={16} color="#9CA3AF" />
                  <Text style={styles.activityDateText}>
                    {new Date(activity.activity_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ActivityIcon size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No activities yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Start by logging your first activity or connecting your health data
            </Text>
          </View>
        )}
      </View>

      {/* Health Data Sources */}
      <View style={styles.healthSection}>
        <Text style={styles.sectionTitle}>Health Data</Text>
        <View style={styles.healthSources}>
          <View style={styles.healthSource}>
            <Apple size={24} color="#000000" />
            <Text style={styles.healthSourceText}>Apple Health</Text>
            <View style={[
              styles.healthStatus, 
              connectedSources.some(s => s.source_type === 'apple_health') && styles.healthStatusConnected
            ]}>
              <Text style={[
                styles.healthStatusText,
                connectedSources.some(s => s.source_type === 'apple_health') && styles.healthStatusTextConnected
              ]}>
                {connectedSources.some(s => s.source_type === 'apple_health') ? 'Connected' : 'Connect'}
              </Text>
            </View>
          </View>

          <View style={styles.healthSource}>
            <Smartphone size={24} color="#4285F4" />
            <Text style={styles.healthSourceText}>Google Fit</Text>
            <View style={[
              styles.healthStatus,
              connectedSources.some(s => s.source_type === 'google_fit') && styles.healthStatusConnected
            ]}>
              <Text style={[
                styles.healthStatusText,
                connectedSources.some(s => s.source_type === 'google_fit') && styles.healthStatusTextConnected
              ]}>
                {connectedSources.some(s => s.source_type === 'google_fit') ? 'Connected' : 'Connect'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Achievement Highlights */}
      {achievementStats.recentAchievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            <TouchableOpacity onPress={() => router.push('/achievements')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsList}>
            {achievementStats.recentAchievements.slice(0, 5).map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Trophy size={20} color="#F59E0B" />
                <Text style={styles.achievementTitle} numberOfLines={2}>
                  {achievement.description}
                </Text>
                <Text style={styles.achievementDate}>
                  {new Date(achievement.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  authContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heroImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 32,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  authButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 4,
  },
  profileButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  quickActions: {
    padding: 24,
  },
  primaryAction: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  recentSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  activityDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  healthSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  healthSources: {
    gap: 12,
  },
  healthSource: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  healthSourceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
    flex: 1,
  },
  healthStatus: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  healthStatusConnected: {
    backgroundColor: '#DCFCE7',
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  healthStatusTextConnected: {
    color: '#16A34A',
  },
  achievementsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  achievementsList: {
    paddingLeft: 0,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 160,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  achievementDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});