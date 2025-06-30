interface VideoGenerationRequest {
  replicaId: string;
  script: string;
  runData: {
    distance: number;
    duration: number;
    pace: number;
    calories: number;
  };
  effortLevel?: string;
  mood?: number;
  backgroundImageUrl?: string;
}

interface TavusResponse {
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  preview_url?: string;
}

class TavusService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_TAVUS_API_KEY || '';
  }

  private generateRunScript(runData: VideoGenerationRequest['runData']): string {
    const { distance, duration, pace, calories } = runData;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    const scripts = [
      `Incredible run today! You crushed ${distance.toFixed(2)} kilometers in ${minutes} minutes and ${seconds} seconds. Your average pace was ${pace.toFixed(2)} minutes per kilometer. You burned approximately ${calories} calories. Keep up the amazing work!`,
      
      `What a fantastic achievement! You just completed a ${distance.toFixed(2)}km run with an average pace of ${pace.toFixed(2)} min/km. Your total time was ${minutes}:${seconds.toString().padStart(2, '0')} and you burned ${calories} calories. You're absolutely crushing your fitness goals!`,
      
      `Outstanding performance on your run today! ${distance.toFixed(2)} kilometers completed in ${minutes} minutes and ${seconds} seconds. With an average pace of ${pace.toFixed(2)} minutes per kilometer, you burned ${calories} calories. Your dedication to fitness is truly inspiring!`,
    ];

    return scripts[Math.floor(Math.random() * scripts.length)];
  }

  async generateVideo(request: VideoGenerationRequest): Promise<TavusResponse> {
    try {
      const script = this.generateRunScript(request.runData);
      
      const payload = {
        replica_id: request.replicaId || 'default-replica',
        script: script,
        video_name: `run_achievement_${Date.now()}`,
        callback_url: null, // We'll poll for status instead
        ...(request.backgroundImageUrl && { 
          background_url: request.backgroundImageUrl 
        }),
      };

      const response = await fetch(`${this.baseUrl}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        video_id: data.video_id,
        status: data.status || 'pending',
        video_url: data.download_url,
        preview_url: data.hosted_url,
      };
    } catch (error) {
      console.error('Error generating video:', error);
      throw error;
    }
  }

  async getVideoStatus(videoId: string): Promise<TavusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        video_id: data.video_id,
        status: data.status,
        video_url: data.download_url,
        preview_url: data.hosted_url,
      };
    } catch (error) {
      console.error('Error checking video status:', error);
      throw error;
    }
  }

  async pollVideoCompletion(
    videoId: string, 
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<TavusResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getVideoStatus(videoId);
        
        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }

        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Video generation timeout');
  }

  // Alternative method using FAL.ai for Tavus integration
  async generateVideoWithFal(request: VideoGenerationRequest): Promise<any> {
    try {
      const script = this.generateRunScript(request.runData);
      
      const payload = {
        replica_id: request.replicaId || 'default-replica',
        script: script,
        background_image_url: request.backgroundImageUrl,
      };

      const response = await fetch('https://fal.run/fal-ai/tavus/hummingbird-lipsync/v0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${process.env.EXPO_PUBLIC_FAL_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`FAL.ai API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating video with FAL:', error);
      throw error;
    }
  }
}

export const tavusService = new TavusService();