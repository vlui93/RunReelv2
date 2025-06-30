import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSettings {
  distanceUnit: 'km' | 'miles';
  paceUnit: 'min/km' | 'min/mile';
  temperatureUnit: 'celsius' | 'fahrenheit';
  firstDayOfWeek: 'sunday' | 'monday';
  notifications: {
    achievements: boolean;
    workoutReminders: boolean;
    weeklyReports: boolean;
  };
}

const defaultSettings: UserSettings = {
  distanceUnit: 'km',
  paceUnit: 'min/km',
  temperatureUnit: 'celsius',
  firstDayOfWeek: 'monday',
  notifications: {
    achievements: true,
    workoutReminders: true,
    weeklyReports: true,
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Conversion utilities
  const convertDistance = (distance: number, fromUnit: 'km' | 'miles' = 'km'): number => {
    if (settings.distanceUnit === fromUnit) return distance;
    
    if (fromUnit === 'km' && settings.distanceUnit === 'miles') {
      return distance * 0.621371;
    } else if (fromUnit === 'miles' && settings.distanceUnit === 'km') {
      return distance / 0.621371;
    }
    
    return distance;
  };

  const convertPace = (pace: number, fromUnit: 'min/km' | 'min/mile' = 'min/km'): number => {
    if (settings.paceUnit === fromUnit) return pace;
    
    if (fromUnit === 'min/km' && settings.paceUnit === 'min/mile') {
      return pace * 1.609344;
    } else if (fromUnit === 'min/mile' && settings.paceUnit === 'min/km') {
      return pace / 1.609344;
    }
    
    return pace;
  };

  const formatDistance = (distance: number, fromUnit: 'km' | 'miles' = 'km'): string => {
    const converted = convertDistance(distance, fromUnit);
    const unit = settings.distanceUnit;
    
    if (converted < 1) {
      const meters = converted * (unit === 'km' ? 1000 : 5280);
      const unitLabel = unit === 'km' ? 'm' : 'ft';
      return `${Math.round(meters)}${unitLabel}`;
    }
    
    return `${converted.toFixed(2)}${unit}`;
  };

  const formatPace = (pace: number, fromUnit: 'min/km' | 'min/mile' = 'min/km'): string => {
    const converted = convertPace(pace, fromUnit);
    const minutes = Math.floor(converted);
    const seconds = Math.floor((converted - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} ${settings.paceUnit}`;
  };

  const formatSpeed = (speed: number): string => {
    const unit = settings.distanceUnit === 'km' ? 'km/h' : 'mph';
    return `${speed.toFixed(1)} ${unit}`;
  };

  return {
    settings,
    loading,
    updateSettings,
    convertDistance,
    convertPace,
    formatDistance,
    formatPace,
    formatSpeed,
  };
}