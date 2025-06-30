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
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'error';
  video_url?: string;
  preview_url?: string;
  thumbnail_url?: string;
  hosted_url?: string;
  download_url?: string;
}

interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  videoId?: string;
  error?: string;
  attempts_made?: number;
  total_time?: number;
  queue_time?: number | string;
  suggestion?: string;
}

class EnhancedTavusService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';
  
  // Enhanced polling configuration for peak usage handling
  private readonly POLLING_CONFIG = {
    maxAttempts: 60,           // Increased from 40 attempts
    initialInterval: 5000,     // Start with 5 seconds
    maxInterval: 20000,        // Cap at 20 seconds
    backoffMultiplier: 1.3,    // Progressive increase
    totalTimeout: 600000,      // Extended to 10 minutes (was 300 seconds)
    queueTimeout: 180000,      // Separate 3-minute queue timeout
    peakUsageThreshold: 180    // 3 minutes indicates peak usage
  };

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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      console.log('🎬 Starting enhanced video generation process...');
      
      // Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const script = this.generateActivityScript(activity);
      
      // Create video generation record with ONLY existing columns
      const videoGenRecord = {
        user_id: user.id,
        run_id: activity.id,
        status: 'pending' as const,
        script_content: script,
      };

      console.log('📝 Creating video generation record...');

      const { data: videoGeneration, error: insertError } = await supabase
        .from('video_generations')
        .insert([videoGenRecord])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Video generation record error:', insertError);
        throw new Error(`Failed to create video generation record: ${insertError.message}`);
      }

      console.log('✅ Video generation record created:', videoGeneration.id);

      // Step 1: Initiate video generation with Tavus API
      const initResult = await this.initiateVideoGeneration(activity, script);
      if (!initResult.success) {
        throw new Error(initResult.error);
      }

      // Update record with Tavus job ID
      await supabase
        .from('video_generations')
        .update({
          tavus_job_id: initResult.video_id,
          status: 'processing',
        })
        .eq('id', videoGeneration.id);

      console.log('🔄 Starting enhanced polling for video completion...');

      // Step 2: Enhanced polling with progressive backoff and peak usage handling
      const pollResult = await this.pollVideoCompletionEnhanced(initResult.video_id);
      
      if (pollResult.success && pollResult.videoUrl) {
        // Update records with final video URL
        await supabase
          .from('video_generations')
          .update({
            status: 'completed',
            video_url: pollResult.videoUrl,
          })
          .eq('id', videoGeneration.id);

        console.log('✅ Video generation completed successfully!');
        return {
          success: true,
          videoUrl: pollResult.videoUrl,
          thumbnailUrl: pollResult.thumbnailUrl,
          videoId: videoGeneration.id,
          attempts_made: pollResult.attempts_made,
          total_time: pollResult.total_time,
          queue_time: pollResult.queue_time
        };
      } else {
        throw new Error(pollResult.error || 'Video generation failed - no video URL returned');
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

  private async initiateVideoGeneration(activity: ActivityData, script: string) {
    try {
      // Use valid Tavus API fields with fast generation enabled for 1080p quality
      const payload = {
        replica_id: process.env.EXPO_PUBLIC_TAVUS_REPLICA_ID || 'default-replica',
        script: script,
        video_name: `activity_${activity.id}_${Date.now()}`,
        fast: true  // Enable fast generation for ~3.25 minutes per minute of content (1080p)
      };

      console.log('📤 Tavus API request (valid fields only):', {
        replica_id: payload.replica_id ? 'SET' : 'MISSING',
        script_length: payload.script.length,
        video_name: payload.video_name,
        fast_generation: 'ENABLED (1080p quality)'
      });

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
      console.log('✅ Tavus video generation initiated:', data.video_id);

      return {
        success: true,
        video_id: data.video_id,
        status: data.status || 'pending'
      };

    } catch (error) {
      console.error('❌ Error initiating video generation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate video generation'
      };
    }
  }

  private async pollVideoCompletionEnhanced(videoId: string): Promise<VideoGenerationResult> {
    console.log(`🔄 Starting enhanced polling for video ${videoId}...`);
    
    let attempts = 0;
    let currentInterval = this.POLLING_CONFIG.initialInterval;
    const startTime = Date.now();
    let queuePhase = true;
    let queueStartTime = startTime;

    while (attempts < this.POLLING_CONFIG.maxAttempts) {
      const elapsedTime = Date.now() - startTime;
      
      // Check total timeout (10 minutes)
      if (elapsedTime > this.POLLING_CONFIG.totalTimeout) {
        console.error(`⏰ Video generation timeout after ${Math.round(elapsedTime / 1000)} seconds`);
        return {
          success: false,
          error: `Video generation timeout after ${Math.round(elapsedTime / 1000)} seconds. This can happen during peak usage periods.`,
          videoId: videoId,
          attempts_made: attempts,
          total_time: Math.round(elapsedTime / 1000),
          suggestion: "Check your Tavus dashboard or try again during off-peak hours (early morning/late evening)"
        };
      }

      try {
        attempts++;
        console.log(`📊 Polling attempt ${attempts}/${this.POLLING_CONFIG.maxAttempts} after ${Math.round(elapsedTime / 1000)}s`);

        // Check video status
        const statusResult = await this.getVideoStatus(videoId);
        
        console.log(`📈 Video status: ${statusResult.status}`);

        // Handle queue status specifically
        if (statusResult.status === 'queued' || statusResult.status === 'pending') {
          if (queuePhase) {
            const queueTime = Date.now() - queueStartTime;
            console.log(`Video still queued after ${Math.round(queueTime / 1000)}s - waiting for processing to begin`);
            
            // Special handling for extended queue times
            if (queueTime > this.POLLING_CONFIG.queueTimeout) {
              console.warn('Video has been queued longer than expected - likely peak usage');
            }
          }
        } else if (statusResult.status === 'processing') {
          if (queuePhase) {
            queuePhase = false; // Processing has begun
            console.log(`Video processing started - status: ${statusResult.status}`);
          }
        }

        // Handle completion states
        if (statusResult.status === 'completed') {
          const videoUrl = statusResult.hosted_url || statusResult.download_url || statusResult.video_url;
          if (videoUrl) {
            console.log(`🎯 Video generation completed successfully!`);
            return {
              success: true,
              videoId: videoId,
              videoUrl: videoUrl,
              thumbnailUrl: statusResult.thumbnail_url,
              attempts_made: attempts,
              total_time: Math.round(elapsedTime / 1000),
              queue_time: queuePhase ? elapsedTime : Math.round((Date.now() - queueStartTime) / 1000)
            };
          }
        }

        if (statusResult.status === 'failed' || statusResult.status === 'error') {
          console.error(`❌ Video generation failed with status: ${statusResult.status}`);
          return {
            success: false,
            error: `Video generation failed with status: ${statusResult.status}`,
            videoId: videoId,
            attempts_made: attempts,
            total_time: Math.round(elapsedTime / 1000)
          };
        }

        // Adaptive polling based on queue vs processing phase
        const pollInterval = queuePhase 
          ? Math.min(currentInterval * 1.5, 30000)  // Longer intervals during queue phase
          : currentInterval;                        // Normal intervals during processing

        // Progressive backoff before next attempt
        if (attempts < this.POLLING_CONFIG.maxAttempts) {
          console.log(`⏳ Waiting ${Math.round(pollInterval / 1000)}s before next attempt...`);
          await this.sleep(pollInterval);
          currentInterval = Math.min(
            currentInterval * this.POLLING_CONFIG.backoffMultiplier,
            this.POLLING_CONFIG.maxInterval
          );
        }

      } catch (error) {
        console.error(`❌ Polling error on attempt ${attempts}:`, error);
        if (attempts >= this.POLLING_CONFIG.maxAttempts) {
          return {
            success: false,
            error: `Polling failed after ${attempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
            videoId: videoId,
            attempts_made: attempts
          };
        }
        // Wait before retrying on error
        await this.sleep(currentInterval);
      }
    }

    console.error(`❌ Maximum polling attempts exceeded (${this.POLLING_CONFIG.maxAttempts})`);
    return {
      success: false,
      error: `Video generation timeout - exceeded maximum polling attempts (${this.POLLING_CONFIG.maxAttempts}). Video may still be processing.`,
      videoId: videoId,
      attempts_made: attempts,
      suggestion: "Video may still be processing. Check your Tavus dashboard manually or try again in a few minutes."
    };
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
        hosted_url: data.hosted_url,
        download_url: data.download_url,
        thumbnail_url: data.thumbnail_url
      };
    } catch (error) {
      console.error('❌ Error checking video status:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async pollVideoCompletion(
    videoId: string, 
    maxAttempts: number = 30,
    intervalMs: number = 3000
  ): Promise<TavusResponse> {
    console.log(`🔄 Using legacy polling for video ${videoId}...`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getVideoStatus(videoId);
        
        console.log(`📊 Poll attempt ${attempt + 1}/${maxAttempts}: ${status.status}`);
        
        if (status.status === 'completed' || status.status === 'failed') {
          console.log(`🎯 Video generation ${status.status}:`, status);
          return status;
        }

        if (attempt < maxAttempts - 1) {
          await this.sleep(intervalMs);
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

  generateAchievementVideo = this.generateActivityVideo;

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