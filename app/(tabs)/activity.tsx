import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useManualActivities } from '@/hooks/useManualActivities';
import { useHealthData } from '@/hooks/useHealthData';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Target, 
  Zap, 
  TrendingUp,
  Filter,
  Search,
  Activity as ActivityIcon,
  Video
} from 'lucide-react-native';

export default function ActivityTab() {
  const { user } = useAuth();
  const { activities, loading, fetchActivities, getActivityStats } = useManualActivities();
  const { importedWorkouts, refreshData } = useHealthData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'running', label: 'Running' },
    { id: 'cycling', label: 'Cycling' },
    { id: 'walking', label: 'Walking' },
    { id: 'strength', label: 'Strength' },
  ];

  useEffect(() => {
    if (user) {
      fetchActivities();
      refreshData();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchActivities(),
      refreshData()
    ]);
    setRefreshing(false);
  };

  const filteredActivities = activities.filter(activity => {
    if (selectedFilter === 'all') return true;
    return activity.activity_type.toLowerCase().includes(selectedFilter);
  });

  const stats = getActivityStats();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <ActivityIcon size={64} color="#9CA3AF" />
        <Text style={styles.authTitle}>Sign in to view activities</Text>
        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.authButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activities</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/manual-entry')}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ActivityIcon size={20} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.totalActivities}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.statValue}>{stats.totalDistance.toFixed(1)}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{Math.floor(stats.totalDuration / 60)}h</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/videos')}
          >
            <Video size={20} color="#8B5CF6" />
            <Text style={styles.statValue}>{stats.videosGenerated || 0}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersList}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.id && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Activities List */}
      <ScrollView 
        style={styles.activitiesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIcon size={48} color="#9CA3AF" />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : filteredActivities.length > 0 ? (
          <View style={styles.activitiesContainer}>
            {filteredActivities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                onPress={() => router.push({
                  pathname: '/activity-details',
                  params: { activityId: activity.id, activityType: 'manual' }
                })}
              >
                <View style={styles.activityHeader}>
                  <View style={styles.activityIcon}>
                    <ActivityIcon size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{activity.activity_name}</Text>
                    <Text style={styles.activityType}>{activity.activity_type}</Text>
                  </View>
                  <View style={styles.activityDate}>
                    <Calendar size={16} color="#9CA3AF" />
                    <Text style={styles.activityDateText}>
                      {formatDate(activity.activity_date)}
                    </Text>
                  </View>
                </View>

                <View style={styles.activityStats}>
                  {activity.distance_km && (
                    <View style={styles.activityStat}>
                      <Target size={16} color="#6B7280" />
                      <Text style={styles.activityStatText}>
                        {activity.distance_km.toFixed(2)}km
                      </Text>
                    </View>
                  )}
                  <View style={styles.activityStat}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.activityStatText}>
                      {formatTime(activity.duration_seconds)}
                    </Text>
                  </View>
                  {activity.calories_burned && (
                    <View style={styles.activityStat}>
                      <Zap size={16} color="#6B7280" />
                      <Text style={styles.activityStatText}>
                        {activity.calories_burned} cal
                      </Text>
                    </View>
                  )}
                </View>

                {activity.notes && (
                  <Text style={styles.activityNotes} numberOfLines={2}>
                    {activity.notes}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ActivityIcon size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No activities found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedFilter === 'all' 
                ? 'Start by logging your first activity'
                : `No ${selectedFilter} activities found`
              }
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => router.push('/manual-entry')}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyStateButtonText}>Log Activity</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 24,
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
  addButton: {
    backgroundColor: '#3B82F6',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
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
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filtersList: {
    paddingHorizontal: 24,
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  activitiesList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  activitiesContainer: {
    padding: 24,
    gap: 16,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  activityType: {
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
  activityStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  activityStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityStatText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  activityNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});