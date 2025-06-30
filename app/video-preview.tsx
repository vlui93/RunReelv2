import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Share,
  Platform,
} from 'react-native';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, MoveHorizontal as MoreHorizontal, Download, Heart, MessageCircle, Bookmark, Video } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  shareUrl?: string;
}

const socialPlatforms: SocialPlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: '🐦',
    color: '#1DA1F2',
    shareUrl: 'https://twitter.com/intent/tweet?text=',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: '#E4405F',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
  },
  {
    id: 'more',
    name: 'More',
    icon: '📤',
    color: '#6B7280',
  },
];

export default function VideoPreviewScreen() {
  const { user } = useAuth();
  const { videoUrl, runId, videoId } = useLocalSearchParams<{ 
    videoUrl: string; 
    runId?: string;
    videoId?: string;
  }>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runData, setRunData] = useState<any>(null);
  const [shareCount, setShareCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (runId) {
      fetchRunData();
    }
    trackVideoView();
  }, [runId, videoId]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const fetchRunData = async () => {
    if (!user) return;
    
    // If no runId provided, skip fetching run data (video-only mode)
    if (!runId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (!error && data) {
        setRunData(data);
      }
    } catch (error) {
      console.error('Error fetching run data:', error);
    }
  };

  const trackVideoView = async () => {
    if (!runId || !user) return;

    try {
      // In a real app, you'd track video views in analytics
      console.log('Video view tracked for run:', runId);
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    setShowControls(true);
  };

  const handleScreenTap = () => {
    setShowControls(!showControls);
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    // Track engagement in database
    try {
      // In a real app, you'd save likes to a separate table
      console.log('Like toggled for video:', runId);
    } catch (error) {
      console.error('Error tracking like:', error);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleComment = () => {
    // Navigate to comments screen
    console.log('Open comments for video:', runId);
  };

  const handleShare = async (platform: SocialPlatform) => {
    const shareText = runData 
      ? `Just completed a ${runData.distance.toFixed(1)}km run in ${Math.floor(runData.duration / 60)} minutes! Check out my AI-generated achievement video! 🏃‍♂️💪 #RunReel #Running`
      : 'Check out my running achievement video! 🏃‍♂️💪 #RunReel';

    setShareCount(prev => prev + 1);

    try {
      if (platform.id === 'twitter' && platform.shareUrl) {
        // Open Twitter share URL
        const url = `${platform.shareUrl}${encodeURIComponent(shareText)}`;
        console.log('Share to Twitter:', url);
      } else if (platform.id === 'more') {
        // Use native share
        await Share.share({
          message: shareText,
          url: videoUrl || '',
        });
      } else {
        // Handle other platforms
        console.log(`Share to ${platform.name}:`, shareText);
      }

      // Track share in database
      await supabase
        .from('video_generations')
        .update({
          // In a real app, you'd track shares in analytics
        })
        .eq('run_id', runId);

    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = async () => {
    // In a real app, you'd implement video download
    console.log('Download video:', videoUrl);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distance: number): string => {
    return `${distance.toFixed(1)}km`;
  };

  const formatPace = (pace: number): string => {
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Video Background */}
      <View style={styles.videoContainer}>
        {/* Placeholder for actual video player */}
        {videoUrl ? (
          <View style={styles.actualVideoContainer}>
            {/* For web, we can use a video element */}
            {Platform.OS === 'web' ? (
              <video
                src={videoUrl}
                controls
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                poster={runData?.thumbnail_url}
              />
            ) : (
              /* For mobile, show video placeholder with play button */
              <View style={styles.videoPlaceholder}>
                <LinearGradient
                  colors={['#1F2937', '#374151']}
                  style={styles.videoGradient}
                >
                  <TouchableOpacity 
                    style={styles.mobilePlayButton}
                    onPress={() => {
                      // On mobile, open video in external player
                      if (videoUrl) {
                        Linking.openURL(videoUrl);
                      }
                    }}
                  >
                    <Play size={48} color="#FFFFFF" />
                    <Text style={styles.mobilePlayText}>Tap to play video</Text>
                  </TouchableOpacity>
                  
                  {/* Video Stats Overlay */}
                  {runData && (
                    <View style={styles.statsOverlay}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{formatDistance(runData.distance)}</Text>
                        <Text style={styles.statLabel}>Distance</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{formatTime(runData.duration)}</Text>
                        <Text style={styles.statLabel}>Time</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {runData.average_pace ? formatPace(runData.average_pace) : '--:--'}
                        </Text>
                        <Text style={styles.statLabel}>min/km</Text>
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <LinearGradient
              colors={['#1F2937', '#374151']}
              style={styles.videoGradient}
            >
              <View style={styles.noVideoContainer}>
                <Video size={48} color="#9CA3AF" />
                <Text style={styles.noVideoText}>Video not available</Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Alternative: Show video in a modal for better control */}
      {Platform.OS === 'web' && videoUrl && (
        <View style={styles.webVideoContainer}>
          <LinearGradient
            colors={['#1F2937', '#374151']}
            style={styles.videoGradient}
          >
            <iframe
              src={videoUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '12px',
              }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </LinearGradient>
        </View>
      )}

        {/* Video Controls Overlay */}
        {Platform.OS !== 'web' && (
          <TouchableOpacity 
            style={styles.videoTouchArea}
            onPress={handleScreenTap}
            activeOpacity={1}
          >
            {showControls && (
              <View style={styles.controlsOverlay}>
                {/* Top Controls */}
                <View style={styles.topControls}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <ArrowLeft size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.muteButton}
                    onPress={handleMuteToggle}
                  >
                    {isMuted ? (
                      <VolumeX size={24} color="#FFFFFF" />
                    ) : (
                      <Volume2 size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Center Play Button */}
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={handlePlayPause}
                >
                  <View style={styles.playButtonBackground}>
                    {isPlaying ? (
                      <Pause size={32} color="#FFFFFF" />
                    ) : (
                      <Play size={32} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}

      {/* Bottom Content */}
      <View style={styles.bottomContent}>
        {/* Video Title */}
        <View style={styles.titleSection}>
          <Text style={styles.videoTitle}>
            {runData ? `${runData.activity_name || 'My Achievement'}` : 'Achievement Video'}
          </Text>
          <Text style={styles.videoSubtitle}>
            {runData ? 
              `${runData.activity_type || 'Activity'} completed on ${formatDate(runData.created_at)}` :
              'AI-generated celebration of your success'
            }
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Heart 
              size={24} 
              color={isLiked ? "#EF4444" : "#6B7280"}
              fill={isLiked ? "#EF4444" : "none"}
            />
            <Text style={styles.actionCount}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleComment}
          >
            <MessageCircle size={24} color="#6B7280" />
            <Text style={styles.actionCount}>{commentCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleBookmark}
          >
            <Bookmark 
              size={24} 
              color={isBookmarked ? "#3B82F6" : "#6B7280"}
              fill={isBookmarked ? "#3B82F6" : "none"}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDownload}
          >
            <Download size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Social Sharing */}
        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Share your achievement</Text>
          <View style={styles.socialButtons}>
            {socialPlatforms.map((platform) => (
              <TouchableOpacity
                key={platform.id}
                style={[
                  styles.socialButton,
                  { backgroundColor: platform.color }
                ]}
                onPress={() => handleShare(platform)}
              >
                <Text style={styles.socialIcon}>{platform.icon}</Text>
                <Text style={styles.socialLabel}>{platform.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {shareCount > 0 && (
            <Text style={styles.shareCount}>
              Shared {shareCount} time{shareCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
  },
  actualVideoContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  webVideoContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mobilePlayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  mobilePlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  noVideoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  noVideoText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  videoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 40,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
    position: 'absolute',
    bottom: 100,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  videoTouchArea: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -35 }, { translateY: -35 }],
  },
  playButtonBackground: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 24,
  },
  videoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  videoSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },
  socialSection: {
    marginBottom: 20,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  socialIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  socialLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  shareCount: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});