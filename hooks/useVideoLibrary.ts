import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface VideoLibraryItem {
  id: string;
  title: string;
  thumbnail_url?: string;
  video_url: string;
  created_at: string;
  updated_at: string;
  duration?: number;
  activity_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  script_content?: string;
  tavus_job_id?: string;
  cost_estimate?: number;
  error_message?: string;
  run_id?: string;
}

export interface VideoStats {
  totalVideos: number;
  completedVideos: number;
  processingVideos: number;
  failedVideos: number;
  thisWeek: number;
  thisMonth: number;
  totalDuration: number;
}

export function useVideoLibrary() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchVideos();
    } else {
      setVideos([]);
      setLoading(false);
    }
  }, [user]);

  const fetchVideos = async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      
      const { data, error } = await supabase
        .from('video_generations')
        .select(`
          id,
          video_url,
          script_content,
          status,
          tavus_job_id,
          cost_estimate,
          error_message,
          created_at,
          updated_at,
          run_id,
          manual_activities!inner(
            activity_type,
            activity_name,
            duration_seconds
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }

      // Transform the data to match our VideoLibraryItem interface
      const transformedVideos: VideoLibraryItem[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.manual_activities?.activity_name || 'Achievement Video',
        video_url: item.video_url || '',
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        script_content: item.script_content,
        tavus_job_id: item.tavus_job_id,
        cost_estimate: item.cost_estimate,
        error_message: item.error_message,
        run_id: item.run_id,
        activity_type: item.manual_activities?.activity_type,
        duration: item.manual_activities?.duration_seconds,
        // Note: Tavus doesn't provide thumbnail URLs in the current API
        // You might need to generate these or use video preview frames
        thumbnail_url: undefined,
      }));

      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateVideoTitle = async (videoId: string, newTitle: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Since we don't have a direct title field in video_generations,
      // we'll update the activity name in manual_activities
      const video = videos.find(v => v.id === videoId);
      if (!video || !video.run_id) {
        throw new Error('Video or associated activity not found');
      }

      const { error } = await supabase
        .from('manual_activities')
        .update({ activity_name: newTitle })
        .eq('id', video.run_id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, title: newTitle } : v
      ));
    } catch (error) {
      console.error('Error updating video title:', error);
      throw error;
    }
  };

  const deleteVideo = async (videoId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('video_generations')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setVideos(prev => prev.filter(v => v.id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  };

  const getVideoStats = (): VideoStats => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalVideos = videos.length;
    const completedVideos = videos.filter(v => v.status === 'completed').length;
    const processingVideos = videos.filter(v => v.status === 'processing' || v.status === 'pending').length;
    const failedVideos = videos.filter(v => v.status === 'failed').length;
    
    const thisWeek = videos.filter(v => new Date(v.created_at) > weekAgo).length;
    const thisMonth = videos.filter(v => new Date(v.created_at) > monthAgo).length;
    
    const totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);

    return {
      totalVideos,
      completedVideos,
      processingVideos,
      failedVideos,
      thisWeek,
      thisMonth,
      totalDuration,
    };
  };

  const getVideoById = (videoId: string): VideoLibraryItem | undefined => {
    return videos.find(v => v.id === videoId);
  };

  const getVideosByStatus = (status: VideoLibraryItem['status']): VideoLibraryItem[] => {
    return videos.filter(v => v.status === status);
  };

  const getVideosByActivityType = (activityType: string): VideoLibraryItem[] => {
    return videos.filter(v => v.activity_type?.toLowerCase() === activityType.toLowerCase());
  };

  const searchVideos = (query: string): VideoLibraryItem[] => {
    const lowercaseQuery = query.toLowerCase();
    return videos.filter(v => 
      v.title.toLowerCase().includes(lowercaseQuery) ||
      v.activity_type?.toLowerCase().includes(lowercaseQuery) ||
      v.script_content?.toLowerCase().includes(lowercaseQuery)
    );
  };

  return {
    videos,
    loading,
    refreshing,
    fetchVideos,
    updateVideoTitle,
    deleteVideo,
    getVideoStats,
    getVideoById,
    getVideosByStatus,
    getVideosByActivityType,
    searchVideos,
  };
}