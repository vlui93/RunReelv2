import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { ThumbsUp, Target, Trophy } from 'lucide-react-native';

interface PostRunModalProps {
  visible: boolean;
  onClose: () => void;
  runData: {
    distance: number;
    duration: number;
    pace: number;
  };
  onComplete: (data: {
    effortLevel: 'encouraged' | 'mission_accomplished' | 'personal_best';
    mood: number;
  }) => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function PostRunModal({
  visible,
  onClose,
  runData,
  onComplete,
}: PostRunModalProps) {
  const [selectedEffort, setSelectedEffort] = useState<
    'encouraged' | 'mission_accomplished' | 'personal_best' | null
  >(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} min`;
  };

  const formatPace = (pace: number): string => {
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const effortOptions = [
    {
      id: 'encouraged' as const,
      label: 'Encouraged',
      icon: ThumbsUp,
      color: '#10B981',
      description: 'Motivational run',
    },
    {
      id: 'mission_accomplished' as const,
      label: 'Mission Accomplished',
      icon: Target,
      color: '#3B82F6',
      description: 'Solid performance',
    },
    {
      id: 'personal_best' as const,
      label: 'Personal Best',
      icon: Trophy,
      color: '#F59E0B',
      description: 'Record-breaking',
    },
  ];

  const moodEmojis = [
    { emoji: '😞', value: 1, label: 'Very\nunhappy' },
    { emoji: '😐', value: 2, label: '' },
    { emoji: '😑', value: 3, label: '' },
    { emoji: '🙂', value: 4, label: '' },
    { emoji: '😄', value: 5, label: '' },
    { emoji: '😆', value: 6, label: 'Extreme\nhappy' },
  ];

  const handleDone = () => {
    if (selectedEffort && selectedMood !== null) {
      onComplete({
        effortLevel: selectedEffort,
        mood: selectedMood,
      });
      onClose();
    }
  };

  const canProceed = selectedEffort && selectedMood !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header Stats */}
          <View style={styles.statsHeader}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{runData.distance.toFixed(1)} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(runData.duration)}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatPace(runData.pace)}</Text>
              <Text style={styles.statLabel}>min/km</Text>
            </View>
          </View>

          {/* Modal Content */}
          <View style={styles.modalContent}>
            <Text style={styles.title}>Run complete</Text>

            {/* Effort Level Selection */}
            <View style={styles.effortSection}>
              {effortOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedEffort === option.id;
                
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.effortOption,
                      isSelected && styles.effortOptionSelected,
                    ]}
                    onPress={() => setSelectedEffort(option.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.effortContent}>
                      <Icon
                        size={24}
                        color={isSelected ? '#FFFFFF' : option.color}
                      />
                      <Text
                        style={[
                          styles.effortLabel,
                          isSelected && styles.effortLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioButton,
                        isSelected && styles.radioButtonSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioButtonInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Mood Selection */}
            <View style={styles.moodSection}>
              <Text style={styles.moodTitle}>How did you feel?</Text>
              
              <View style={styles.moodOptions}>
                {moodEmojis.map((mood) => (
                  <TouchableOpacity
                    key={mood.value}
                    style={[
                      styles.moodOption,
                      selectedMood === mood.value && styles.moodOptionSelected,
                    ]}
                    onPress={() => setSelectedMood(mood.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.moodLabels}>
                <Text style={styles.moodLabelText}>Very{'\n'}unhappy</Text>
                <Text style={styles.moodLabelText}>Extreme{'\n'}happy</Text>
              </View>
            </View>

            {/* Done Button */}
            <TouchableOpacity
              style={[
                styles.doneButton,
                !canProceed && styles.doneButtonDisabled,
              ]}
              onPress={handleDone}
              disabled={!canProceed}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.doneButtonText,
                  !canProceed && styles.doneButtonTextDisabled,
                ]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: screenHeight * 0.85,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  effortSection: {
    marginBottom: 32,
  },
  effortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  effortOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  effortContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  effortLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  effortLabelSelected: {
    color: '#FFFFFF',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  moodSection: {
    marginBottom: 32,
  },
  moodTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  moodOptionSelected: {
    backgroundColor: '#3B82F6',
    transform: [{ scale: 1.1 }],
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  moodLabelText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doneButtonTextDisabled: {
    color: '#9CA3AF',
  },
});