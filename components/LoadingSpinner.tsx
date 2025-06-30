import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity } from 'lucide-react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'medium' 
}: LoadingSpinnerProps) {
  const iconSize = size === 'small' ? 24 : size === 'large' ? 48 : 32;
  
  return (
    <View style={styles.container}>
      <View style={styles.spinner}>
        <Activity size={iconSize} color="#3B82F6" />
      </View>
      <Text style={[styles.message, styles[`${size}Text`]]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    color: '#6B7280',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
});