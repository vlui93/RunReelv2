import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface ApiUsageRecord {
  id: string;
  user_id: string;
  api_service: string;
  request_type: string;
  request_timestamp: string;
  response_status: string;
  cost_estimate?: number;
  request_payload?: any;
  response_data?: any;
}

export interface UsageLimits {
  maxVideoGenerations: number;
  currentCount: number;
  remainingCount: number;
  canGenerate: boolean;
}

export function useApiUsage() {
  const { user } = useAuth();
  const [usageRecords, setUsageRecords] = useState<ApiUsageRecord[]>([]);
  const [limits, setLimits] = useState<UsageLimits>({
    maxVideoGenerations: 3,
    currentCount: 0,
    remainingCount: 3,
    canGenerate: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  const fetchUsageData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('request_timestamp', { ascending: false });

      if (error) throw error;

      setUsageRecords(data || []);

      // Calculate video generation limits
      const videoGenerations = data?.filter(
        record => record.api_service === 'tavus' && 
                 record.request_type === 'video_generation' &&
                 record.response_status === 'success'
      ) || [];

      const currentCount = videoGenerations.length;
      const maxVideoGenerations = 3;
      const remainingCount = Math.max(0, maxVideoGenerations - currentCount);
      const canGenerate = remainingCount > 0;

      setLimits({
        maxVideoGenerations,
        currentCount,
        remainingCount,
        canGenerate,
      });
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkVideoGenerationLimit = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .rpc('check_video_generation_limit', { p_user_id: user.id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking video generation limit:', error);
      return false;
    }
  };

  const trackApiUsage = async (
    apiService: string,
    requestType: string,
    status: string,
    payload?: any,
    response?: any,
    costEstimate?: number
  ): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('api_usage_tracking')
        .insert({
          user_id: user.id,
          api_service: apiService,
          request_type: requestType,
          response_status: status,
          request_payload: payload,
          response_data: response,
          cost_estimate: costEstimate,
        });

      if (error) throw error;

      // Refresh usage data
      await fetchUsageData();
    } catch (error) {
      console.error('Error tracking API usage:', error);
    }
  };

  const getUsageByService = (service: string) => {
    return usageRecords.filter(record => record.api_service === service);
  };

  const getUsageByType = (type: string) => {
    return usageRecords.filter(record => record.request_type === type);
  };

  const getTotalCost = () => {
    return usageRecords.reduce((total, record) => {
      return total + (record.cost_estimate || 0);
    }, 0);
  };

  const getSuccessRate = (service?: string) => {
    const relevantRecords = service 
      ? usageRecords.filter(record => record.api_service === service)
      : usageRecords;

    if (relevantRecords.length === 0) return 0;

    const successCount = relevantRecords.filter(
      record => record.response_status === 'success'
    ).length;

    return (successCount / relevantRecords.length) * 100;
  };

  return {
    usageRecords,
    limits,
    loading,
    fetchUsageData,
    checkVideoGenerationLimit,
    trackApiUsage,
    getUsageByService,
    getUsageByType,
    getTotalCost,
    getSuccessRate,
  };
}