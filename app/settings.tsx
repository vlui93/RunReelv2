import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { router } from 'expo-router';
import { useSettings } from '@/hooks/useSettings';
import { ArrowLeft, Globe, Clock, Thermometer, Calendar, Bell } from 'lucide-react-native';

export default function SettingsScreen() {
  const { settings, updateSettings, loading } = useSettings();

  const handleDistanceUnitChange = (unit: 'km' | 'miles') => {
    updateSettings({
      distanceUnit: unit,
      paceUnit: unit === 'km' ? 'min/km' : 'min/mile'
    });
  };

  const handleTemperatureUnitChange = (unit: 'celsius' | 'fahrenheit') => {
    updateSettings({ temperatureUnit: unit });
  };

  const handleFirstDayOfWeekChange = (day: 'sunday' | 'monday') => {
    updateSettings({ firstDayOfWeek: day });
  };

  const handleNotificationToggle = (notificationType: keyof typeof settings.notifications, value: boolean) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [notificationType]: value
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Units Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Units</Text>
          </View>

          {/* Distance Unit */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Distance</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  styles.segmentButtonLeft,
                  settings.distanceUnit === 'km' && styles.segmentButtonActive
                ]}
                onPress={() => handleDistanceUnitChange('km')}
              >
                <Text style={[
                  styles.segmentButtonText,
                  settings.distanceUnit === 'km' && styles.segmentButtonTextActive
                ]}>
                  Kilometers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  styles.segmentButtonRight,
                  settings.distanceUnit === 'miles' && styles.segmentButtonActive
                ]}
                onPress={() => handleDistanceUnitChange('miles')}
              >
                <Text style={[
                  styles.segmentButtonText,
                  settings.distanceUnit === 'miles' && styles.segmentButtonTextActive
                ]}>
                  Miles
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Temperature Unit */}
          <View style={styles.settingItem}>
            <View style={styles.settingHeader}>
              <Thermometer size={16} color="#6B7280" />
              <Text style={styles.settingLabel}>Temperature</Text>
            </View>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  styles.segmentButtonLeft,
                  settings.temperatureUnit === 'celsius' && styles.segmentButtonActive
                ]}
                onPress={() => handleTemperatureUnitChange('celsius')}
              >
                <Text style={[
                  styles.segmentButtonText,
                  settings.temperatureUnit === 'celsius' && styles.segmentButtonTextActive
                ]}>
                  °C
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  styles.segmentButtonRight,
                  settings.temperatureUnit === 'fahrenheit' && styles.segmentButtonActive
                ]}
                onPress={() => handleTemperatureUnitChange('fahrenheit')}
              >
                <Text style={[
                  styles.segmentButtonText,
                  settings.temperatureUnit === 'fahrenheit' && styles.segmentButtonTextActive
                ]}>
                  °F
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Calendar Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>Calendar</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>First day of week</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  styles.segmentButtonLeft,
                  settings.firstDayOfWeek === 'sunday' && styles.segmentButtonActive
                ]}
                onPress={() => handleFirstDayOfWeekChange('sunday')}
              >
                <Text style={[
                  styles.segmentButtonText,
                  settings.firstDayOfWeek === 'sunday' && styles.segmentButtonTextActive
                ]}>
                  Sunday
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  styles.segmentButtonRight,
                  settings.firstDayOfWeek === 'monday' && styles.segmentButtonActive
                ]}
                onPress={() => handleFirstDayOfWeekChange('monday')}
              >
                <Text style={[
                  styles.segmentButtonText,
                  settings.firstDayOfWeek === 'monday' && styles.segmentButtonTextActive
                ]}>
                  Monday
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Achievement notifications</Text>
            <Switch
              value={settings.notifications.achievements}
              onValueChange={(value) => handleNotificationToggle('achievements', value)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={settings.notifications.achievements ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Workout reminders</Text>
            <Switch
              value={settings.notifications.workoutReminders}
              onValueChange={(value) => handleNotificationToggle('workoutReminders', value)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={settings.notifications.workoutReminders ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Weekly reports</Text>
            <Switch
              value={settings.notifications.weeklyReports}
              onValueChange={(value) => handleNotificationToggle('weeklyReports', value)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={settings.notifications.weeklyReports ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Current Settings Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Settings</Text>
          <View style={styles.currentSettings}>
            <Text style={styles.currentSettingText}>
              Distance: {settings.distanceUnit === 'km' ? 'Kilometers' : 'Miles'}
            </Text>
            <Text style={styles.currentSettingText}>
              Pace: {settings.paceUnit}
            </Text>
            <Text style={styles.currentSettingText}>
              Temperature: {settings.temperatureUnit === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
            </Text>
            <Text style={styles.currentSettingText}>
              Week starts: {settings.firstDayOfWeek === 'sunday' ? 'Sunday' : 'Monday'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginLeft: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonLeft: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  segmentButtonRight: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#3B82F6',
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  currentSettings: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  currentSettingText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});