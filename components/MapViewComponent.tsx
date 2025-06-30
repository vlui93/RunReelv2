import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MapPin, Navigation, Activity } from 'lucide-react-native';

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface MapViewComponentProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  routeData: LocationPoint[];
  isRunning: boolean;
  isPaused: boolean;
  style?: any;
}

export default function MapViewComponent({
  region,
  routeData,
  isRunning,
  isPaused,
  style
}: MapViewComponentProps) {
  // For now, show a placeholder on all platforms since react-native-maps
  // requires additional native setup that's not available in Expo managed workflow
  return (
    <View style={[styles.mapPlaceholder, style]}>
      <View style={styles.mapHeader}>
        <MapPin size={32} color="#3B82F6" />
        <Text style={styles.mapTitle}>GPS Tracking</Text>
      </View>
      
      <Text style={styles.mapPlaceholderText}>
        {Platform.OS === 'web' 
          ? 'Map visualization available on mobile devices with native build' 
          : 'GPS tracking active - Map view coming soon'
        }
      </Text>
      
      {routeData.length > 0 && (
        <View style={styles.routeInfo}>
          <View style={styles.routeStats}>
            <View style={styles.routeStat}>
              <Navigation size={16} color="#6B7280" />
              <Text style={styles.routeStatText}>
                {routeData.length} points
              </Text>
            </View>
            
            {isRunning && (
              <View style={[styles.statusIndicator, isPaused ? styles.pausedIndicator : styles.activeIndicator]}>
                <View style={[styles.statusDot, isPaused ? styles.pausedDot : styles.activeDot]} />
                <Text style={styles.statusText}>
                  {isPaused ? 'Paused' : 'Recording'}
                </Text>
              </View>
            )}
          </View>
          
          {routeData.length > 1 && (
            <View style={styles.coordinateInfo}>
              <Text style={styles.coordinateText}>
                Start: {routeData[0].latitude.toFixed(4)}, {routeData[0].longitude.toFixed(4)}
              </Text>
              <Text style={styles.coordinateText}>
                Current: {routeData[routeData.length - 1].latitude.toFixed(4)}, {routeData[routeData.length - 1].longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {!isRunning && routeData.length === 0 && (
        <View style={styles.readyState}>
          <Activity size={24} color="#9CA3AF" />
          <Text style={styles.readyText}>Ready to track your route</Text>
        </View>
      )}
      
      <View style={styles.upgradeNote}>
        <Text style={styles.upgradeText}>
          📍 Full interactive map with route visualization coming in future updates
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  routeInfo: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeStatText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeIndicator: {
    backgroundColor: '#DCFCE7',
  },
  pausedIndicator: {
    backgroundColor: '#FEF3C7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: '#16A34A',
  },
  pausedDot: {
    backgroundColor: '#D97706',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  coordinateInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  coordinateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  readyState: {
    alignItems: 'center',
    marginBottom: 20,
  },
  readyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  upgradeNote: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  upgradeText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});