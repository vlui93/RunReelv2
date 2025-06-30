import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAchievements } from '@/hooks/useAchievements';
import { useEnhancedVideoGeneration } from '@/hooks/useEnhancedVideoGeneration';
import { ArrowLeft, Trophy, Target, Zap, Star, Video, Play, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AchievementsScreen() {
  const { achievements, loading, stats, markAchievementAsProcessed } = useAchievements();
  const { 
    generateAchievementVideo, 
    isGenerating, 
    progress, 
    error, 
    currentStep,
    getProgressPercentage,
    resetState,
    state 
  } = useEnhancedVideoGeneration();
  
  const [selectedFormat, setSelectedFormat] = useState<'square' | 'vertical' | 'horizontal'>('square');
  const [generatingAchievementId, setGeneratingAchievementId] = useState<string | null>(null);

  const unprocessedAchievements = achievements.filter(a => !a.is_processed);
  const processedAchievements = achievements.filter(a => a.is_processed);

  const handleGenerateVideo = async (achievement: any) => {
    try {
      setGeneratingAchievementId(achievement.id);
      resetState();

      const customization = {
        format: selectedFormat,
        voiceType: 'motivational' as const,
        backgroundStyle: getBackgroundStyle(achievement),
        musicStyle: 'energetic' as const,
        includeStats: true,
        includeBranding: true
      };

      const result = await generateAchievementVideo(achievement, customization);
      
      if (result?.videoUrl) {
        await markAchievementAsProcessed(achievement.id);
        Alert.alert(
          'Video Generated!',
          'Your achievement video has been created successfully.',
          [
            { text: 'View Video', onPress: () => router.push({
              pathname: '/video-preview',
              params: { videoUrl: result.videoUrl, achievementId: achievement.id }
            })},
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate video. Please try again.');
    } finally {
      setGeneratingAchievementId(null);
    }
  };

  const getBackgroundStyle = (achievement: any) => {
    if (achievement.workout?.workout_type === 'running') return 'running_track';
    if (achievement.workout?.workout_type === 'cycling') return 'mountain_road';
    if (achievement.workout?.workout_type === 'walking') return 'nature_path';
    if (achievement.achievement_type === 'streak') return 'calendar';
    return 'confetti';
  };

  const getAchievementIcon = (achievement: any) => {
    switch (achievement.achievement_type) {
      case 'personal_record':
        return <Trophy size={24} color="#F59E0B" />;
      case 'milestone':
        return <Target size={24} color="#3B82F6" />;
      case 'streak':
        return <Zap size={24} color="#EF4444" />;
      case 'first_time':
        return <Star size={24} color="#10B981" />;
      default:
        return <Trophy size={24} color="#6B7280" />;
    }
  };

  const formatAchievementValue = (achievement: any): string => {
    switch (achievement.category) {
      case 'distance':
        return `${(achievement.value / 1000).toFixed(2)} km`;
      case 'duration':
        return `${Math.floor(achievement.value / 60)} min`;
      case 'pace':
        return `${achievement.value.toFixed(2)} min/km`;
      case 'calories':
        return `${Math.round(achievement.value)} cal`;
      case 'frequency':
      case 'consistency':
        return `${achievement.value} ${achievement.value === 1 ? 'day' : 'days'}`;
      default:
        return achievement.value.toString();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Trophy size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.totalAchievements}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={20} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.personalRecords}</Text>
            <Text style={styles.statLabel}>Records</Text>
          </View>
          <View style={styles.statCard}>
            <Zap size={20} color="#EF4444" />
            <Text style={styles.statValue}>{stats.streaks}</Text>
            <Text style={styles.statLabel}>Streaks</Text>
          </View>
          <View style={styles.statCard}>
            <Video size={20} color="#8B5CF6" />
            <Text style={styles.statValue}>{stats.unprocessedCount}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
        </View>
      </View>

      {/* Video Format Selection */}
      {unprocessedAchievements.length > 0 && (
        <View style={styles.formatSection}>
          <Text style={styles.sectionTitle}>Video Format</Text>
          <View style={styles.formatButtons}>
            {[
              { key: 'square', label: '1:1', description: 'Instagram' },
              { key: 'vertical', label: '9:16', description: 'Stories' },
              { key: 'horizontal', label: '16:9', description: 'YouTube' }
            ].map((format) => (
              <TouchableOpacity
                key={format.key}
                style={[
                  styles.formatButton,
                  selectedFormat === format.key && styles.formatButtonSelected
                ]}
                onPress={() => setSelectedFormat(format.key as any)}
              >
                <Text style={[
                  styles.formatButtonText,
                  selectedFormat === format.key && styles.formatButtonTextSelected
                ]}>
                  {format.label}
                </Text>
                <Text style={[
                  styles.formatButtonDescription,
                  selectedFormat === format.key && styles.formatButtonDescriptionSelected
                ]}>
                  {format.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
            
            <View style={styles.estimateContainer}>
              <Text style={styles.estimateText}>
                Expected: {state.isPeakUsage ? '3-6 minutes' : '1-2 minutes'}
              </Text>
              {state.isPeakUsage && (
                <Text style={styles.peakUsageHint}>
                  💡 Using fast generation (1080p). Try off-peak hours for even faster processing.
                </Text>
              )}
            </View>
        </View>
      )}

      {/* New Achievements */}
      {unprocessedAchievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>
            New Achievements ({unprocessedAchievements.length})
          </Text>
          {unprocessedAchievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <View style={styles.achievementHeader}>
                <View style={styles.achievementIcon}>
                  {getAchievementIcon(achievement)}
                </View>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementTitle}>{achievement.description}</Text>
                  <Text style={styles.achievementValue}>
                    {formatAchievementValue(achievement)}
                  </Text>
                  <Text style={styles.achievementDate}>
                    {new Date(achievement.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>

              {/* Generate Video Button */}
              <TouchableOpacity
                style={[
                  styles.generateButton,
                  (isGenerating && generatingAchievementId === achievement.id) && styles.generateButtonDisabled
                ]}
                onPress={() => handleGenerateVideo(achievement)}
                disabled={isGenerating && generatingAchievementId === achievement.id}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.generateButtonGradient}
                >
                  {isGenerating && generatingAchievementId === achievement.id ? (
                    <>
                      <Settings size={16} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>
                        {progress || 'Generating...'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Video size={16} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>Generate Video</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Progress Bar */}
              {isGenerating && generatingAchievementId === achievement.id && (
                <View style={styles.progressContainer}>
                  {state.isPeakUsage && (
                    <View style={styles.peakUsageWarning}>
                      <Text style={styles.peakUsageText}>⏰ Peak Usage Detected</Text>
                      <Text style={styles.peakUsageSubtext}>
                        Queue times are longer than usual. Your video will process soon.
                      </Text>
                    </View>
                  )}
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${getProgressPercentage()}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {currentStep === 'initializing' && 'Initializing...'}
                    {currentStep === 'processing' && 'Processing with AI...'}
                    {currentStep === 'processing' && state.isPeakUsage && 'Waiting in queue - peak usage detected...'}
                    {currentStep === 'finalizing' && 'Finalizing video...'}
                    {currentStep === 'completed' && 'Completed!'}
                    {currentStep === 'failed' && 'Failed'}
                  </Text>
                </View>
              )}

              {error && generatingAchievementId === achievement.id && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Processed Achievements */}
      {processedAchievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>
            Previous Achievements ({processedAchievements.length})
          </Text>
          {processedAchievements.map((achievement) => (
            <View key={achievement.id} style={styles.processedAchievementCard}>
              <View style={styles.achievementHeader}>
                <View style={styles.achievementIcon}>
                  {getAchievementIcon(achievement)}
                </View>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementTitle}>{achievement.description}</Text>
                  <Text style={styles.achievementValue}>
                    {formatAchievementValue(achievement)}
                  </Text>
                  <Text style={styles.achievementDate}>
                    {new Date(achievement.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.viewVideoButton}>
                  <Play size={16} color="#8B5CF6" />
                  <Text style={styles.viewVideoText}>View Video</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {achievements.length === 0 && (
        <View style={styles.emptyState}>
          <Trophy size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No Achievements Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Connect your health data and start working out to unlock achievements!
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.connectButtonText}>Connect Health Data</Text>
          </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  statsContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  formatSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  formatButtonSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F4F6',
  },
  formatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  formatButtonTextSelected: {
    color: '#8B5CF6',
  },
  formatButtonDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  formatButtonDescriptionSelected: {
    color: '#8B5CF6',
  },
  achievementsSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  processedAchievementCard: {
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
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  achievementValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
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
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  viewVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewVideoText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});