import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native';
import { Clock, CircleAlert as AlertCircle, ExternalLink, X } from 'lucide-react-native';

interface VideoGenerationProgressProps {
  isGenerating: boolean;
  progress: string;
  currentStep: 'initializing' | 'processing' | 'finalizing' | 'completed' | 'failed';
  elapsedTime: number;
  estimatedTimeRemaining: number;
  isPeakUsage: boolean;
  progressPercentage: number;
  onCancel: () => void;
  onCheckDashboard?: () => void;
}

export default function VideoGenerationProgress({
  isGenerating,
  progress,
  currentStep,
  elapsedTime,
  estimatedTimeRemaining,
  isPeakUsage,
  progressPercentage,
  onCancel,
  onCheckDashboard
}: VideoGenerationProgressProps) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    // Show advanced options after 2 minutes
    if (elapsedTime > 120) {
      setShowAdvancedOptions(true);
    }
  }, [elapsedTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getStepColor = (step: string): string => {
    switch (step) {
      case 'initializing':
        return '#3B82F6';
      case 'processing':
        return isPeakUsage ? '#F59E0B' : '#10B981';
      case 'finalizing':
        return '#8B5CF6';
      case 'completed':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const handleCheckDashboard = () => {
    if (onCheckDashboard) {
      onCheckDashboard();
    } else {
      const dashboardUrl = 'https://app.tavus.io/videos';
      if (Platform.OS === 'web') {
        window.open(dashboardUrl, '_blank');
      } else {
        Linking.openURL(dashboardUrl);
      }
    }
  };

  if (!isGenerating) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Generating Your Achievement Video</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <X size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Main Progress Indicator */}
      <View style={styles.progressSection}>
        <ActivityIndicator 
          size="large" 
          color={getStepColor(currentStep)} 
          style={styles.spinner}
        />
        
        <Text style={[styles.progressMessage, { color: getStepColor(currentStep) }]}>
          {progress}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: getStepColor(currentStep)
                }
              ]} 
            />
          </View>
          <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
        </View>
      </View>

      {/* Time Information */}
      <View style={styles.timeSection}>
        <View style={styles.timeItem}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.timeLabel}>Elapsed:</Text>
          <Text style={styles.timeValue}>{formatTime(elapsedTime)}</Text>
        </View>
        
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Expected:</Text>
          <Text style={[styles.timeValue, isPeakUsage && styles.peakTimeValue]}>
            {isPeakUsage ? '3-6 minutes' : '1-2 minutes'}
          </Text>
        </View>
      </View>

      {/* Peak Usage Warning */}
      {isPeakUsage && (
        <View style={styles.peakUsageWarning}>
          <AlertCircle size={20} color="#F59E0B" />
          <View style={styles.peakUsageContent}>
            <Text style={styles.peakUsageTitle}>Peak Usage Detected</Text>
            <Text style={styles.peakUsageText}>
              Queue times are longer than usual. Your video will process soon.
            </Text>
            <Text style={styles.peakUsageHint}>
              💡 Using fast generation (1080p). Try off-peak hours for even faster processing.
            </Text>
          </View>
        </View>
      )}

      {/* Processing Steps */}
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>Processing Steps</Text>
        <View style={styles.steps}>
          {[
            { key: 'initializing', label: 'Initializing', icon: '🚀' },
            { key: 'processing', label: isPeakUsage ? 'Queued/Processing' : 'Processing', icon: '🎬' },
            { key: 'finalizing', label: 'Finalizing', icon: '✨' },
            { key: 'completed', label: 'Completed', icon: '🎉' }
          ].map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted = ['initializing', 'processing', 'finalizing'].indexOf(currentStep) > index;
            
            return (
              <View key={step.key} style={styles.step}>
                <View style={[
                  styles.stepIndicator,
                  isActive && styles.stepIndicatorActive,
                  isCompleted && styles.stepIndicatorCompleted
                ]}>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                </View>
                <Text style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive
                ]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Advanced Options */}
      {showAdvancedOptions && (
        <View style={styles.advancedOptions}>
          <Text style={styles.advancedTitle}>Need Help?</Text>
          
          <TouchableOpacity 
            style={styles.dashboardButton} 
            onPress={handleCheckDashboard}
          >
            <ExternalLink size={16} color="#3B82F6" />
            <Text style={styles.dashboardButtonText}>Check Tavus Dashboard</Text>
          </TouchableOpacity>

          {elapsedTime > 300 && ( // Show after 5 minutes
            <View style={styles.timeoutInfo}>
              <Text style={styles.timeoutText}>
                Video generation is taking longer than expected with fast mode enabled. This can happen during peak usage periods.
              </Text>
              <Text style={styles.timeoutSubtext}>
                Your video may still be processing in 1080p quality. Check the dashboard or try again during off-peak hours.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {elapsedTime > 60 && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={onCancel}
          >
            <Text style={styles.secondaryButtonText}>Cancel & Try Later</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  progressMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  peakTimeValue: {
    color: '#F59E0B',
  },
  peakUsageWarning: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  peakUsageContent: {
    flex: 1,
    marginLeft: 12,
  },
  peakUsageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  peakUsageText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 6,
  },
  peakUsageHint: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepIndicatorActive: {
    backgroundColor: '#3B82F6',
  },
  stepIndicatorCompleted: {
    backgroundColor: '#10B981',
  },
  stepIcon: {
    fontSize: 16,
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  advancedOptions: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
    marginBottom: 16,
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dashboardButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
  },
  timeoutInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  timeoutText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  timeoutSubtext: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});