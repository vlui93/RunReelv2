// Video Generation Types - Aligned with actual database schema

export interface VideoGenerationRecord {
  id: string;
  user_id: string;
  run_id?: string;              // References manual_activities table
  tavus_job_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  script_content?: string;
  cost_estimate?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityData {
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

export interface VideoCustomization {
  format: 'square' | 'vertical' | 'horizontal';
  voiceType?: 'motivational' | 'encouraging' | 'calm' | 'excited' | 'proud';
  backgroundStyle?: 'running_track' | 'mountain_road' | 'nature_path' | 'confetti' | 'calendar';
  musicStyle?: 'energetic' | 'uplifting' | 'peaceful' | 'triumphant';
  includeStats?: boolean;
  includeBranding?: boolean;
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  videoId?: string;
  error?: string;
}

export interface TavusResponse {
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  preview_url?: string;
  thumbnail_url?: string;
}