import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { Clock, Target, Zap, Video, Share2, Home } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface RunData {
  id: string;
  distance: number;
  duration: number;
  average_pace: number;
  calories: number;
  video_url: string | null;
  created_at: string;
}

export default function RunSummaryScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const [run, setRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isGenerating, progress, error, videoUrl, generateVideo, resetState } = useVideoGeneration();

  useEffect(() => {
    if (runId) {
      fetchRunData();
    }
  }, [runId]);

  const fetchRunData = async () => {
    if (!runId) return;

    try {
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (error) {
        console.error('Error fetching run:', error);
        Alert.alert('Error', 'Failed to load run data');
        router.back();
      } else {
        setRun(data);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load run data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!run) return;

    try {
      resetState();
      await generateVideo(run.id, run);
      // Refresh run data to get the updated video URL
      await fetchRunData();
    } catch (error) {
      console.error('Video generation failed:', error);
    }
  };

  const handleShare = () => {
    // Placeholder for sharing functionality
    Alert.alert('Share', 'Sharing functionality will be implemented here');
  };

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading run summary...</Text>
      </View>
    );
  }

  if (!run) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Run data not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Run Complete!</Text>
        <Text style={styles.subtitle}>Great job on your run</Text>
        <Text style={styles.date}>{formatDate(run.created_at)}</Text>
      </View>

      {/* Main Stats */}
      <View style={styles.mainStatsContainer}>
        <View style={styles.primaryStat}>
          <Text style={styles.primaryStatValue}>{formatDistance(run.distance)}</Text>
          <Text style={styles.primaryStatLabel}>Distance</Text>
        </View>
        <View style={styles.primaryStat}>
          <Text style={styles.primaryStatValue}>{formatTime(run.duration)}</Text>
          <Text style={styles.primaryStatLabel}>Time</Text>
        </View>
      </View>

      {/* Secondary Stats */}
      <View style={styles.secondaryStatsContainer}>
        <View style={styles.statCard}>
          <Target size={24} color="#10B981" />
          <Text style={styles.statValue}>
            {run.average_pace ? formatPace(run.average_pace) : '--:--'}
          </Text>
          <Text style={styles.statLabel}>Avg. Pace</Text>
        </View>
        <View style={styles.statCard}>
          <Zap size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{run.calories || 0}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
      </View>

      {/* Video Section */}
      <View style={styles.videoSection}>
        <Text style={styles.sectionTitle}>AI Achievement Video</Text>
        
        {run.video_url ? (
          <View style={styles.videoContainer}>
            <Video size={48} color="#8B5CF6" />
            <Text style={styles.videoTitle}>Your achievement video is ready!</Text>
            <Text style={styles.videoSubtitle}>Tap to view your personalized AI-generated video</Text>
            <TouchableOpacity 
              style={styles.videoButton}
              onPress={() => router.push({
                pathname: '/video-preview',
                params: { videoUrl: run.video_url, runId: run.id }
              })}
            >
              <Text style={styles.videoButtonText}>View Video</Text>
            </TouchableOpacity>
          </View>
        ) : isGenerating ? (
          <View style={styles.generatingContainer}>
            <Video size={48} color="#3B82F6" />
            <Text style={styles.generatingTitle}>Generating Your Video...</Text>
            <Text style={styles.generatingProgress}>{progress}</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>
        ) : error ? (
          <View style={styles.errorVideoContainer}>
            <Video size={48} color="#EF4444" />
            <Text style={styles.errorVideoTitle}>Video Generation Failed</Text>
            <Text style={styles.errorVideoText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleGenerateVideo}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.videoPromptContainer}>
            <Video size={48} color="#6B7280" />
            <Text style={styles.videoPromptTitle}>Create Achievement Video</Text>
            <Text style={styles.videoPromptText}>
              Generate a personalized AI video celebrating your run achievement
            </Text>
            <TouchableOpacity style={styles.generateButton} onPress={handleGenerateVideo}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.generateButtonGradient}
              >
                <Video size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generate Video</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={20} color="#1F2937" />
          <Text style={styles.actionButtonText}>Share Run</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryActionButton]} 
          onPress={() => router.push('/(tabs)')}
        >
          <Home size={20} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
            Back to Home
          </Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  mainStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  primaryStat: {
    alignItems: 'center',
  },
  primaryStatValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1F2937',
  },
  primaryStatLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  secondaryStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
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
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  videoSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  videoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  videoSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  videoButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  generatingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  generatingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  generatingProgress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    width: '60%',
    borderRadius: 2,
  },
  errorVideoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  errorVideoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
  },
  errorVideoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  videoPromptContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  videoPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  videoPromptText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  generateButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsContainer: {
    marginHorizontal: 24,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  primaryActionButton: {
    backgroundColor: '#3B82F6',
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
  },
});