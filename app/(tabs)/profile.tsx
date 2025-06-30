import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useManualActivities } from '@/hooks/useManualActivities';
import { useVideoLibrary } from '@/hooks/useVideoLibrary';
import { useAchievements } from '@/hooks/useAchievements';
import { User, Settings, Trophy, Target, TrendingUp, Calendar, LogOut, CreditCard as Edit, Share2, Award, Activity as ActivityIcon, Video } from 'lucide-react-native';

export default function ProfileTab() {
  const { user, signOut } = useAuth();
  const { getActivityStats } = useManualActivities();
  const { getVideoStats } = useVideoLibrary();
  const { stats: achievementStats } = useAchievements();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(tabs)');
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <User size={64} color="#9CA3AF" />
        <Text style={styles.authTitle}>Create your profile</Text>
        <Text style={styles.authSubtitle}>
          Sign in to track your progress and achievements
        </Text>
        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.authButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = getActivityStats();
  const videoStats = getVideoStats();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editButton}>
            <Edit size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.userName}>
          {user.user_metadata?.username || 'Runner'}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        
        <View style={styles.profileActions}>
          <TouchableOpacity style={styles.profileActionButton}>
            <Edit size={16} color="#3B82F6" />
            <Text style={styles.profileActionText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileActionButton}>
            <Share2 size={16} color="#3B82F6" />
            <Text style={styles.profileActionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ActivityIcon size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.totalActivities}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={24} color="#10B981" />
            <Text style={styles.statValue}>{stats.totalDistance.toFixed(1)}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{Math.floor(stats.totalDuration / 60)}h</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color="#EF4444" />
            <Text style={styles.statValue}>{videoStats.completedVideos}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
        </View>
      </View>

      {/* Achievement Highlights */}
      <View style={styles.achievementsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <TouchableOpacity onPress={() => router.push('/achievements')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {achievementStats.recentAchievements.length > 0 ? (
          <View style={styles.achievementsList}>
            {achievementStats.recentAchievements.slice(0, 3).map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <View style={styles.achievementIcon}>
                  <Trophy size={20} color="#F59E0B" />
                </View>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementTitle}>{achievement.description}</Text>
                  <Text style={styles.achievementDate}>
                    {new Date(achievement.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Award size={16} color="#9CA3AF" />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyAchievements}>
            <Trophy size={48} color="#9CA3AF" />
            <Text style={styles.emptyAchievementsText}>
              Start working out to unlock achievements!
            </Text>
          </View>
        )}
      </View>

      {/* Activity Breakdown */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Activity Breakdown</Text>
        <View style={styles.activityBreakdown}>
          {Object.entries(stats.activityTypes).map(([type, count]) => (
            <View key={type} style={styles.activityTypeCard}>
              <View style={styles.activityTypeHeader}>
                <ActivityIcon size={20} color="#3B82F6" />
                <Text style={styles.activityTypeName}>{type}</Text>
              </View>
              <Text style={styles.activityTypeCount}>{count} activities</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsList}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/manual-entry')}
          >
            <ActivityIcon size={24} color="#3B82F6" />
            <Text style={styles.actionTitle}>Log Activity</Text>
            <Text style={styles.actionSubtitle}>Add a new workout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/videos')}
          >
            <Video size={24} color="#8B5CF6" />
            <Text style={styles.actionTitle}>Video Library</Text>
            <Text style={styles.actionSubtitle}>View your videos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/activity')}
          >
            <Calendar size={24} color="#10B981" />
            <Text style={styles.actionTitle}>Activity History</Text>
            <Text style={styles.actionSubtitle}>View all workouts</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.signOutSection}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
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
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileHeader: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profileActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 6,
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    backgroundColor: '#F9FAFB',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  achievementsSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  achievementDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyAchievements: {
    alignItems: 'center',
    padding: 32,
  },
  emptyAchievementsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  activitySection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityBreakdown: {
    gap: 12,
  },
  activityTypeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  activityTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  activityTypeCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
    flex: 1,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  signOutSection: {
    padding: 24,
    marginTop: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});