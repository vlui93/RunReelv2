interface VideoGenerationRequest {
  activityId: string;
  format: 'square' | 'vertical' | 'horizontal';
  customization?: {
    voiceType?: 'motivational' | 'encouraging' | 'calm' | 'excited' | 'proud';
    backgroundStyle?: 'running_track' | 'mountain_road' | 'nature_path' | 'confetti' | 'calendar';
    musicStyle?: 'energetic' | 'uplifting' | 'peaceful' | 'triumphant';
    includeStats?: boolean;
    includeBranding?: boolean;
  };
}

interface ActivityData {
  id: string;
  activity_type: string;
  activity_name: string;
  distance_km?: number;
  duration_seconds: number;
  calories_burned?: number;
  average_heart_rate?: number;
  intensity_level?: number;
  notes?: string;
}

interface TavusResponse {
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  preview_url?: string;
  thumbnail_url?: string;
}

interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  videoId?: string;
  error?: string;
}

class EnhancedTavusService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_TAVUS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ TAVUS API KEY MISSING: Please set EXPO_PUBLIC_TAVUS_API_KEY in your environment variables');
    }
  }

  private generateActivityScript(activity: ActivityData): string {
    const { activity_type, activity_name, distance_km, duration_seconds, calories_burned } = activity;
    
    const durationMinutes = Math.floor(duration_seconds / 60);
    const distanceText = distance_km ? `${distance_km.toFixed(2)} kilometers` : '';
    const caloriesText = calories_burned ? `${calories_burned} calories` : '';
    
    const scripts = [
      `Incredible achievement! You just completed ${activity_name}${distanceText ? ` covering ${distanceText}` : ''} in ${durationMinutes} minutes${caloriesText ? ` and burned ${caloriesText}` : ''}. Your dedication to fitness is truly inspiring!`,
      
      `What a fantastic ${activity_type.toLowerCase()} session! ${activity_name} completed${distanceText ? ` - ${distanceText}` : ''} in ${durationMinutes} minutes${caloriesText ? ` with ${caloriesText} burned` : ''}. You're absolutely crushing your fitness goals!`,
      
      `Outstanding performance on your ${activity_type.toLowerCase()} today! ${distanceText ? `${distanceText} completed` : `${activity_name} finished`} in ${durationMinutes} minutes${caloriesText ? ` burning ${caloriesText}` : ''}. Keep up the amazing work!`,
    ];

    return scripts[Math.floor(Math.random() * scripts.length)];
  }

  private getVideoConfig(format: string, customization?: VideoGenerationRequest['customization']) {
    const baseConfig = {
      square: { width: 1080, height: 1080, aspect_ratio: '1:1' },
      vertical: { width: 1080, height: 1920, aspect_ratio: '9:16' },
      horizontal: { width: 1920, height: 1080, aspect_ratio: '16:9' }
    };

    return {
      ...baseConfig[format as keyof typeof baseConfig],
      voice_type: customization?.voiceType || 'motivational',
      background_style: customization?.backgroundStyle || 'running_track',
      music_style: customization?.musicStyle || 'energetic',
      include_stats: customization?.includeStats !== false,
      include_branding: customization?.includeBranding !== false
    };
  }

  async generateActivityVideo(
    activity: ActivityData, 
    format: 'square' | 'vertical' | 'horizontal' = 'square',
    customization?: VideoGenerationRequest['customization']
  ): Promise<VideoGenerationResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Tavus API key is missing. Please set EXPO_PUBLIC_TAVUS_API_KEY in your environment variables.'
      };
    }

    try {
      // Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const script = this.generateActivityScript(activity);
      const videoConfig = this.getVideoConfig(format, customization);
      
      // Create video generation record with ONLY existing columns
      const videoGenRecord = {
        user_id: user.id,                    // ✅ EXISTS in schema
        run_id: activity.id,                 // ✅ EXISTS in schema (references manual_activities)
        status: 'pending' as const,          // ✅ EXISTS in schema
        script_content: script,              // ✅ EXISTS in schema
        // ❌ REMOVED: achievement_id, template_id, video_format, generation_config
        // These columns don't exist in the actual schema
      };

      console.log('📝 Creating video generation record with correct schema:', videoGenRecord);

      const { data: videoGeneration, error: insertError } = await supabase
        .from('video_generations')
        .insert([videoGenRecord])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Video generation record error:', insertError);
        throw new Error(`Failed to create video generation record: ${insertError.message}`);
      }

      console.log('✅ Video generation record created:', videoGeneration);

      // Generate video using Tavus API
      // ✅ CORRECT: Only use valid Tavus API fields
      const payload = {
        replica_id: process.env.EXPO_PUBLIC_TAVUS_REPLICA_ID || 'default-replica',
        replica_id: process.env.EXPO_PUBLIC_TAVUS_REPLICA_ID || 'default-replica',
        script: script,
        video_name: `activity_${activity.id}_${Date.now()}`
        // ❌ REMOVED: callback_url: null (cannot be null if included)
        // ❌ REMOVED: videoConfig (contains invalid fields)
      };

      console.log('🎬 Generating video with Tavus API...', { 
        activityType: activity.activity_type,
        format,
        scriptLength: script.length 
      });
**Important**: 
- Without the Tavus API key, video generation will fail
- The replica must be in "Ready" status before use
- Only use the supported Tavus API fields to avoid 400 errors
        // ❌ REMOVED: callback_url: null (cannot be null if included)
        // ❌ REMOVED: videoConfig (contains invalid fields like include_stats, voice_type, etc.)
      console.log('📤 Tavus API payload (valid fields only):', payload);

      const response = await fetch(`${this.baseUrl}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Tavus API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Tavus API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Tavus video generation started:', data);

      // Update video generation record with Tavus job ID
      await supabase
        .from('video_generations')
        .update({
          tavus_job_id: data.video_id,
          status: 'processing',
        })
        .eq('id', videoGeneration.id);

      // Poll for completion
      const completedVideo = await this.pollVideoCompletion(data.video_id, 30, 3000);

      if (completedVideo.status === 'completed' && completedVideo.video_url) {
        // Update records with final video URL
        await supabase
          .from('video_generations')
          .update({
            status: 'completed',
            video_url: completedVideo.video_url,
          })
          .eq('id', videoGeneration.id);

        return {
          success: true,
          videoUrl: completedVideo.video_url,
          thumbnailUrl: completedVideo.thumbnail_url,
          videoId: videoGeneration.id
        };
      } else {
        throw new Error('Video generation failed - no video URL returned');
      }

    } catch (error) {
      console.error('❌ Video generation error:', error);
      
      // Update video generation record with error if it was created
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('video_generations')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('user_id', user.id)
            .in('status', ['pending', 'processing']);
        }
      } catch (updateError) {
        console.error('❌ Failed to update video generation record with error:', updateError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video generation failed'
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<TavusResponse> {
    if (!this.apiKey) {
      throw new Error('Tavus API key is missing. Please set EXPO_PUBLIC_TAVUS_API_KEY in your environment variables.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavus API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return {
        video_id: data.video_id,
        status: data.status,
        video_url: data.download_url,
        preview_url: data.hosted_url,
        thumbnail_url: data.thumbnail_url
      };
    } catch (error) {
      console.error('❌ Error checking video status:', error);
      throw error;
    }
  }

  async pollVideoCompletion(
    videoId: string, 
    maxAttempts: number = 30,
    intervalMs: number = 3000
  ): Promise<TavusResponse> {
    console.log(`🔄 Polling video completion for ${videoId}...`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getVideoStatus(videoId);
        
        console.log(`📊 Poll attempt ${attempt + 1}/${maxAttempts}: ${status.status}`);
        
        if (status.status === 'completed' || status.status === 'failed') {
          console.log(`🎯 Video generation ${status.status}:`, status);
          return status;
        }

        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        console.error(`❌ Polling attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Video generation timeout - exceeded maximum polling attempts');
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Get configuration status for debugging
  getConfigStatus(): { configured: boolean, message: string } {
    if (!this.apiKey) {
      return {
        configured: false,
        message: 'Tavus API key is missing. Please set EXPO_PUBLIC_TAVUS_API_KEY in your .env file.'
      };
    }
    
    return {
      configured: true,
      message: 'Tavus API is properly configured.'
    };
  }
}

export const enhancedTavusService = new EnhancedTavusService();

// Import supabase client
import { supabase } from '@/lib/supabase';