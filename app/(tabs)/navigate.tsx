import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useRunTracking } from '@/hooks/useRunTracking';
import { 
  Play, 
  Pause, 
  Square, 
  MapPin, 
  Clock, 
  Target, 
  Zap,
  Navigation as NavigationIcon,
  Activity,
  Video,
  Plus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapViewComponent from '@/components/MapViewComponent';
import PostRunModal from '@/components/PostRunModal';

export default function NavigateTab() {
  const { user } = useAuth();
  const {
    isRunning,
    isPaused,
    stats,
    hasLocationPermission,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
    saveRun,
    formatTime,
    formatPace,
    formatDistance,
    routeData,
  } = useRunTracking();

  const [showPostRunModal, setShowPostRunModal] = useState(false);
  const [runDataForModal, setRunDataForModal] = useState(null);

  const handleStartRun = async () => {
    if (!hasLocationPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions to track your run.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert(
        'GPS Tracking',
        'GPS tracking is limited on web. For full GPS functionality, use the mobile app.',
        [
          { text: 'Cancel' },
          { text: 'Continue', onPress: () => startRun() }
        ]
      );
    } else {
      await startRun();
    }
  };

  const handleStopRun = async () => {
    const runData = await stopRun();
    if (runData) {
      setRunDataForModal(runData);
      setShowPostRunModal(true);
    }
  };

  const handlePostRunComplete = async (data: { effortLevel: string; mood: number }) => {
    if (runDataForModal) {
      const savedRun = await saveRun(data);
      if (savedRun) {
        setShowPostRunModal(false);
        setRunDataForModal(null);
        router.push({
          pathname: '/run-summary',
          params: { runId: savedRun.id }
        });
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <NavigationIcon size={64} color="#9CA3AF" />
        <Text style={styles.authTitle}>Sign in to track runs</Text>
        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => router.push('/(tabs)/activity')}
        >
          <Text style={styles.authButtonText}>Sign In</Text>
          <Activity size={24} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>View Activities</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>GPS Tracking</Text>
        {Platform.OS === 'web' && (
          <View style={styles.webNotice}>
            <Text style={styles.webNoticeText}>Limited on web</Text>
          </View>
        )}
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          region={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          routeData={routeData}
          isRunning={isRunning}
          isPaused={isPaused}
          style={styles.map}
        />
      </View>

      {/* Stats Display */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Target size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{formatDistance(stats.distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color="#10B981" />
            <Text style={styles.statValue}>{formatTime(stats.duration)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statCard}>
            <NavigationIcon size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{formatPace(stats.currentPace)}</Text>
            <Text style={styles.statLabel}>Pace</Text>
          </View>
          <View style={styles.statCard}>
            <Zap size={24} color="#EF4444" />
            <Text style={styles.statValue}>{stats.calories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isRunning ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStartRun}>
            <Video size={20} color="#8B5CF6" />
            <Text style={styles.secondaryActionText}>My Videos</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.runningControls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={isPaused ? resumeRun : pauseRun}
            >
              <LinearGradient
                colors={isPaused ? ['#3B82F6', '#1D4ED8'] : ['#F59E0B', '#D97706']}
                style={styles.controlButtonGradient}
              >
                {isPaused ? (
                  <Play size={24} color="#FFFFFF" />
                ) : (
                  <Pause size={24} color="#FFFFFF" />
                )}
                <Text style={styles.controlButtonText}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={handleStopRun}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.controlButtonGradient}
              >
                <Square size={24} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Stop</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Location Permission Notice */}
      {!hasLocationPermission && (
        <View style={styles.permissionNotice}>
          <MapPin size={20} color="#F59E0B" />
          <Plus size={20} color="#10B981" />
          <Text style={styles.secondaryActionText}>Log Activity</Text>
        </View>
      )}

      {/* Post Run Modal */}
      {showPostRunModal && runDataForModal && (
        <PostRunModal
          visible={showPostRunModal}
          onClose={() => setShowPostRunModal(false)}
          runData={runDataForModal}
          onComplete={handlePostRunComplete}
        />
      )}
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
  webNotice: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  webNoticeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  controlsContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  runningControls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  controlButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  permissionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  permissionNoticeText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
});