import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import ManualActivityForm from '@/components/ManualActivityForm';
import { useManualActivities, ActivityFormData } from '@/hooks/useManualActivities';

export default function ManualEntryScreen() {
  const { createActivity, submitting } = useManualActivities();

  const handleSubmit = async (data: ActivityFormData) => {
    try {
      const activity = await createActivity(data);
      if (activity) {
        Alert.alert(
          'Success!',
          'Activity saved successfully',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save activity. Please try again.');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ManualActivityForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});