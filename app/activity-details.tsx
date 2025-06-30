import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedVideoGeneration } from '@/hooks/useEnhancedVideoGeneration';
import { useApiUsage } from '@/hooks/useApiUsage';
import { useSettings } from '@/hooks/useSettings';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Target,
  Zap,
  Heart,
  TrendingUp,
  Video,
  Share2,
  Download,
  Play,
  Settings,
  Activity,
  Gauge,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ActivityDetails {
  id: string;
  activity_type?: string;
  activity_name?: string;
  workout_type?: string;
  start_time: string;
  end_time?: string;
  activity_date?: string;
  distance?: number;
  distance_km?: number;
  duration: number;
  duration_seconds?: number;
  calories?: number;
  calories_burned?: number;
  average_heart_rate?: number;
  heart_rate_avg?: number;
  heart_rate_max?: number;
  pace_avg?: number;
  elevation_gain?: number;
  intensity_level?: number;
  notes?: string;
  weather_conditions?: string;
  video_generated?: boolean;
  video_url?: string;
  metadata?: any;
  source_type?: 'manual' | 'imported';
}

export default function ActivityDetailsScreen() {
  const { user } = useAuth();
  const { activityId, activityType } = useLocalSearchParams<{
    activityId: string;
    activityType: 'manual' | 'imported';
  }>();

  const [activity, setActivity] = useState<ActivityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<'square' | 'vertical' | 'horizontal'>('square');

  const {
    generateActivityVideo,
    isGenerating,
    progress,
    error,
    currentStep,
    getProgressPercentage,
    resetState,
    isPeakUsage,
  } = useEnhancedVideoGeneration();

  const { limits } = useApiUsage();
  const { formatDistance, formatPace, formatSpeed, settings } = useSettings();

  useEffect(() => {
    if (activityId && activityType && user) {
      fetchActivityDetails();
    }
  }, [activityId, activityType, user]);

  const fetchActivityDetails = async () => {
    if (!user || !activityId) return;

    setLoading(true);
    try {
      let data, error;

      if (activityType === 'manual') {
        ({ data, error } = await supabase
          .from('manual_activities')
          .select('*')
          .eq('id', activityId)
          .eq('user_id', user.id)
          .single());
      } else {
        ({ data, error } = await supabase
          .from('imported_workouts')
          .select('*')
          .eq('id', activityId)
          .eq('user_id', user.id)
          .single());
      }

      if (error) {
        console.error('Error fetching activity details:', error);
        Alert.alert('Error', 'Failed to load activity details');
        router.back();
        return;
      }

      if (data) {
        setActivity({
          ...data,
          source_type: activityType,
        });
      } else {
        Alert.alert('Error', 'Activity not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching activity details:', error);
      Alert.alert('Error', 'Failed to load activity details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!activity) {
      Alert.alert('Error', 'Activity data not found');
      return;
    }

    if (!limits.canGenerate) {
      Alert.alert(
        'Video Generation Limit',
        `You have reached your video generation limit (${limits.maxVideoGenerations} videos). Please upgrade to generate more videos.`
      );
      return;
    }

    try {
      resetState();

      // Prepare activity data for video generation
      const activityData = {
        id: activity.id,
        activity_type: activity.activity_type || activity.workout_type || 'running',
        activity_name: activity.activity_name || `${activity.activity_type || activity.workout_type} Workout`,
        distance_km: activity.distance_km || (activity.distance ? activity.distance / 1000 : undefined),
        duration_seconds: activity.duration_seconds || activity.duration || 0,
        calories_burned: activity.calories_burned || activity.calories,
        average_heart_rate: activity.average_heart_rate || activity.heart_rate_avg,
        intensity_level: activity.intensity_level,
        notes: activity.notes
      };

      const customization = {
        format: selectedFormat,
        voiceType: 'motivational' as const,
        backgroundStyle: getBackgroundStyle(activityData),
        musicStyle: 'energetic' as const,
        includeStats: true,
        includeBranding: true,
      };

      const result = await generateActivityVideo(activityData, customization);

      if (result?.videoUrl) {
        // Update the activity with the video URL        
        if (activityType === 'manual') {
          await supabase
            .from('manual_activities')
            .update({
              video_url: result.videoUrl,
              video_generated: true,
            })
            .eq('id', activity.id);
        } else {
          await supabase
            .from('imported_workouts')
            .update({
              metadata: { 
                ...activity.metadata, 
                video_url: result.videoUrl 
              }
            })
            .eq('id', activity.id);
        }

        setActivity(prev => prev ? {
          ...prev,
          video_url: result.videoUrl,
          video_generated: true,
        } : null);

        Alert.alert(
          'Video Generated!',
          'Your activity video has been created successfully.',
          [
            {
              text: 'View Video',
              onPress: () => router.push({
                pathname: '/video-preview',
                params: { videoUrl: result.videoUrl, runId: activity.id },
              }),
            },
            { text: 'OK' },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate video. Please try again.');
    }
  };

  const getBackgroundStyle = (activity: { activity_type: string }) => {
    const type = activity.activity_type || '';
    if (type.toLowerCase().includes('running')) return 'running_track';
    if (type.toLowerCase().includes('cycling')) return 'mountain_road';
    if (type.toLowerCase().includes('walking')) return 'nature_path';
    return 'confetti';
  };

  const handleShare = async () => {
    if (!activity) return;

    const shareText = `Check out my ${activity.activity_name || activity.workout_type} activity! ${formatDistance(activity.distance || activity.distance_km || 0)} in ${formatTime(activity.duration || activity.duration_seconds || 0)}`;

    try {
      await Share.share({
        message: shareText,
        url: activity.video_url || '',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Handle Web Share API permission errors specifically
      if (Platform.OS === 'web' && error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
          Alert.alert(
            'Sharing Not Available',
            'Sharing is not available in this browser environment. This may be due to security restrictions or the need for HTTPS. You can manually copy the activity details to share.'
          );
          return;
        }
      }
      
      Alert.alert('Error', 'Unable to share at this time. Please try again later.');
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0s';
    
    const totalMinutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Activity size={48} color="#3B82F6" />
        <Text style={styles.loadingText}>Loading activity details...</Text>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Activity not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const distance = activity.distance || activity.distance_km || 0;
  const duration = activity.duration || activity.duration_seconds || 0;
  const calories = activity.calories || activity.calories_burned || 0;
  const heartRate = activity.average_heart_rate || activity.heart_rate_avg || 0;
  const pace = activity.pace_avg || (distance > 0 ? (duration / 60) / distance : 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Activity Title */}
      <View style={styles.titleSection}>
        <Text style={styles.activityTitle}>
          {activity.activity_name || `${activity.activity_type || activity.workout_type} Workout`}
        </Text>
        <View style={styles.activityMeta}>
          <View style={styles.metaItem}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.metaText}>
              {formatDate(activity.activity_date || activity.start_time)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.metaText}>
              {formatDateTime(activity.start_time)}
            </Text>
          </View>
          {activity.source_type && (
            <View style={[styles.sourceBadge, activity.source_type === 'manual' ? styles.manualBadge : styles.importedBadge]}>
              <Text style={styles.sourceBadgeText}>
                {activity.source_type === 'manual' ? 'Manual' : 'Imported'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Main Stats */}
      <View style={styles.mainStatsContainer}>
        <View style={styles.primaryStatsRow}>
          <View style={styles.primaryStatCard}>
            <Text style={styles.primaryStatValue}>{formatDistance(distance, 'km')}</Text>
            <Text style={styles.primaryStatLabel}>Distance</Text>
          </View>
          <View style={styles.primaryStatCard}>
            <Text style={styles.primaryStatValue}>{formatTime(duration)}</Text>
            <Text style={styles.primaryStatLabel}>Duration</Text>
          </View>
        </View>
      </View>

      {/* Secondary Stats */}
      <View style={styles.secondaryStatsContainer}>
        <View style={styles.statsGrid}>
          {pace > 0 && (
            <View style={styles.statCard}>
              <Target size={20} color="#3B82F6" />
              <Text style={styles.statValue}>{formatPace(pace, 'min/km')}</Text>
              <Text style={styles.statLabel}>Avg. Pace</Text>
            </View>
          )}
          
          {pace > 0 && (
            <View style={styles.statCard}>
              <Gauge size={20} color="#8B5CF6" />
              <Text style={styles.statValue}>{formatSpeed(60 / pace)}</Text>
              <Text style={styles.statLabel}>Avg. Speed</Text>
            </View>
          )}
          
          {calories > 0 && (
            <View style={styles.statCard}>
              <Zap size={20} color="#F59E0B" />
              <Text style={styles.statValue}>{calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          )}
          
          {heartRate > 0 && (
            <View style={styles.statCard}>
              <Heart size={20} color="#EF4444" />
              <Text style={styles.statValue}>{heartRate} bpm</Text>
              <Text style={styles.statLabel}>Avg. HR</Text>
            </View>
          )}
          
          {activity.heart_rate_max && (
            <View style={styles.statCard}>
              <Heart size={20} color="#DC2626" />
              <Text style={styles.statValue}>{activity.heart_rate_max} bpm</Text>
              <Text style={styles.statLabel}>Max HR</Text>
            </View>
          )}
          
          {activity.elevation_gain && activity.elevation_gain > 0 && (
            <View style={styles.statCard}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.statValue}>{activity.elevation_gain.toFixed(0)}m</Text>
              <Text style={styles.statLabel}>Elevation</Text>
            </View>
          )}
          
          {activity.metadata?.cadence && (
            <View style={styles.statCard}>
              <Activity size={20} color="#6366F1" />
              <Text style={styles.statValue}>{activity.metadata.cadence}</Text>
              <Text style={styles.statLabel}>Cadence</Text>
            </View>
          )}
          
          {activity.metadata?.stride_length && (
            <View style={styles.statCard}>
              <Activity size={20} color="#059669" />
              <Text style={styles.statValue}>{activity.metadata.stride_length}m</Text>
              <Text style={styles.statLabel}>Stride</Text>
            </View>
          )}
        </View>
      </View>

      {/* Split Times Section */}
      {activity.metadata?.splits && activity.metadata.splits.length > 0 && (
        <View style={styles.splitsSection}>
          <Text style={styles.sectionTitle}>Split Times</Text>
          <View style={styles.splitsContainer}>
            {activity.metadata.splits.map((split: any, index: number) => (
              <View key={index} style={styles.splitCard}>
                <Text style={styles.splitDistance}>
                  {settings.distanceUnit === 'km' ? `${index + 1}km` : `${(index + 1) * 0.621371}mi`}
                </Text>
                <Text style={styles.splitTime}>{formatPace(split.pace, 'min/km')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Heart Rate Zones */}
      {activity.metadata?.heart_rate_zones && (
        <View style={styles.heartRateSection}>
          <Text style={styles.sectionTitle}>Heart Rate Zones</Text>
          <View style={styles.heartRateZones}>
            {Object.entries(activity.metadata.heart_rate_zones).map(([zone, time]: [string, any]) => (
              <View key={zone} style={styles.heartRateZone}>
                <View style={[styles.zoneIndicator, { backgroundColor: getZoneColor(zone) }]} />
                <Text style={styles.zoneName}>{zone}</Text>
                <Text style={styles.zoneTime}>{formatTime(time)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Additional Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Details</Text>
        
        {activity.intensity_level && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Intensity Level</Text>
            <View style={styles.intensityContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.intensityDot,
                    level <= activity.intensity_level! && styles.intensityDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {activity.weather_conditions && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Weather</Text>
            <Text style={styles.detailValue}>{activity.weather_conditions}</Text>
          </View>
        )}

        {activity.heart_rate_max && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Max Heart Rate</Text>
            <Text style={styles.detailValue}>{activity.heart_rate_max} bpm</Text>
          </View>
        )}

        {activity.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={styles.notesText}>{activity.notes}</Text>
          </View>
        )}
      </View>

      {/* Video Generation Section */}
      <View style={styles.videoSection}>
        <Text style={styles.sectionTitle}>AI Achievement Video</Text>
        
        {activity.video_url ? (
          <View style={styles.videoContainer}>
            <Video size={48} color="#8B5CF6" />
            <Text style={styles.videoTitle}>Your video is ready!</Text>
            <Text style={styles.videoSubtitle}>Tap to view your personalized achievement video</Text>
            <TouchableOpacity
              style={styles.videoButton}
              onPress={() => router.push({
                pathname: '/video-preview',
                params: { videoUrl: activity.video_url, activityId: activity.id },
              })}
            >
              <Play size={16} color="#FFFFFF" />
              <Text style={styles.videoButtonText}>View Video</Text>
            </TouchableOpacity>
          </View>
        ) : isGenerating ? (
          <View style={styles.generatingContainer}>
            <Video size={48} color="#3B82F6" />
            <Text style={styles.generatingTitle}>Generating Your Video...</Text>
            <Text style={styles.generatingProgress}>{progress}</Text>
            {isPeakUsage && (
              <View style={styles.peakUsageWarning}>
                <Text style={styles.peakUsageText}>⏰ Peak Usage Detected</Text>
                <Text style={styles.peakUsageSubtext}>
                  Queue times are longer than usual. Your video will process soon.
                </Text>
              </View>
            )}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentStep === 'initializing' && 'Initializing...'}
              {currentStep === 'processing' && !isPeakUsage && 'Processing with AI...'}
              {currentStep === 'processing' && isPeakUsage && 'Waiting in queue - peak usage detected...'}
              {currentStep === 'finalizing' && 'Finalizing video...'}
              {currentStep === 'completed' && 'Completed!'}
              {currentStep === 'failed' && 'Failed'}
            </Text>
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
              Generate a personalized AI video celebrating this activity
            </Text>
            
            {/* Video Format Selection */}
            <View style={styles.formatSection}>
              <Text style={styles.formatTitle}>Video Format</Text>
              <View style={styles.formatButtons}>
                {[
                  { key: 'square', label: '1:1', description: 'Instagram' },
                  { key: 'vertical', label: '9:16', description: 'Stories' },
                  { key: 'horizontal', label: '16:9', description: 'YouTube' },
                ].map((format) => (
                  <TouchableOpacity
                    key={format.key}
                    style={[
                      styles.formatButton,
                      selectedFormat === format.key && styles.formatButtonSelected,
                    ]}
                    onPress={() => setSelectedFormat(format.key as any)}
                  >
                    <Text
                      style={[
                        styles.formatButtonText,
                        selectedFormat === format.key && styles.formatButtonTextSelected,
                      ]}
                    >
                      {format.label}
                    </Text>
                    <Text
                      style={[
                        styles.formatButtonDescription,
                        selectedFormat === format.key && styles.formatButtonDescriptionSelected,
                      ]}
                    >
                      {format.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.estimateContainer}>
                <Text style={styles.estimateText}>
                  Expected: {isPeakUsage ? '3-6 minutes' : '1-2 minutes'}
                </Text>
                {isPeakUsage && (
                  <Text style={styles.peakUsageHint}>
                    💡 Using fast generation (1080p). Try off-peak hours for even faster processing.
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.generateButton, !limits.canGenerate && styles.generateButtonDisabled]}
              onPress={handleGenerateVideo}
              disabled={!limits.canGenerate}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={limits.canGenerate ? ['#8B5CF6', '#7C3AED'] : ['#9CA3AF', '#6B7280']}
                style={styles.generateButtonGradient}
              >
                <Video size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>
                  {limits.canGenerate ? 'Generate Video' : `Limit Reached (${limits.currentCount}/${limits.maxVideoGenerations})`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  activityTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  manualBadge: {
    backgroundColor: '#EEF2FF',
  },
  importedBadge: {
    backgroundColor: '#DCFCE7',
  },
  sourceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainStatsContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  primaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryStatCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  primaryStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  primaryStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  secondaryStatsContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  splitsSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  splitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  splitCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  splitDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  splitTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  heartRateSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  heartRateZones: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  heartRateZone: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  zoneIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  zoneName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  zoneTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailsSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  intensityDotActive: {
    backgroundColor: '#3B82F6',
  },
  notesSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 8,
  },
  videoSection: {
    marginHorizontal: 24,
    marginBottom: 32,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 8,
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
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  peakUsageWarning: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  peakUsageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  peakUsageSubtext: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
    textAlign: 'center',
  },
  estimateContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  estimateText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  peakUsageHint: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
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
  formatSection: {
    width: '100%',
    marginTop: 24,
    marginBottom: 16,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  formatButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  formatButtonSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F4F6',
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  formatButtonTextSelected: {
    color: '#8B5CF6',
  },
  formatButtonDescription: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  formatButtonDescriptionSelected: {
    color: '#8B5CF6',
  },
  generateButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
    width: '100%',
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

// Helper function for heart rate zone colors
const getZoneColor = (zone: string): string => {
  switch (zone.toLowerCase()) {
    case 'zone 1':
    case 'recovery':
      return '#10B981';
    case 'zone 2':
    case 'aerobic':
      return '#3B82F6';
    case 'zone 3':
    case 'tempo':
      return '#F59E0B';
    case 'zone 4':
    case 'threshold':
      return '#EF4444';
    case 'zone 5':
    case 'anaerobic':
      return '#DC2626';
    default:
      return '#6B7280';
  }
};