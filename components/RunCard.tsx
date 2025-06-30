import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock, Target, Zap, Video } from 'lucide-react-native';

interface RunCardProps {
  run: {
    id: string;
    distance: number;
    duration: number;
    average_pace: number | null;
    calories: number | null;
    video_url: string | null;
    created_at: string;
  };
  onPress?: () => void;
}

export default function RunCard({ run, onPress }: RunCardProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number): string => {
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distance: number): string => {
    return `${distance.toFixed(2)}km`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.dateText}>{formatDate(run.created_at)}</Text>
        </View>
        {run.video_url && (
          <View style={styles.videoIndicator}>
            <Video size={16} color="#8B5CF6" />
          </View>
        )}
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDistance(run.distance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.stat}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.statValue}>{formatTime(run.duration)}</Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>
        <View style={styles.stat}>
          <Target size={16} color="#6B7280" />
          <Text style={styles.statValue}>
            {run.average_pace ? formatPace(run.average_pace) : '--:--'}
          </Text>
          <Text style={styles.statLabel}>Pace</Text>
        </View>
        <View style={styles.stat}>
          <Zap size={16} color="#6B7280" />
          <Text style={styles.statValue}>{run.calories || 0}</Text>
          <Text style={styles.statLabel}>Cal</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  videoIndicator: {
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderRadius: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});