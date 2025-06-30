import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useVideoLibrary } from '@/hooks/useVideoLibrary';
import { Video, Play, MoveVertical as MoreVertical, CreditCard as Edit3, Trash2, Share2, Download, Calendar, Clock, Target, Search, Filter, Grid2x2 as Grid, List, X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface VideoItem {
  id: string;
  title: string;
  thumbnail_url?: string;
  video_url: string;
  created_at: string;
  duration?: number;
  activity_type?: string;
  status: 'completed' | 'processing' | 'failed';
  script_content?: string;
}

export default function VideosTab() {
  const { user } = useAuth();
  const {
    videos,
    loading,
    refreshing,
    fetchVideos,
    updateVideoTitle,
    deleteVideo,
    getVideoStats,
  } = useVideoLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const filters = [
    { id: 'all', label: 'All Videos' },
    { id: 'running', label: 'Running' },
    { id: 'cycling', label: 'Cycling' },
    { id: 'walking', label: 'Walking' },
    { id: 'strength', label: 'Strength' },
    { id: 'recent', label: 'Recent' },
  ];

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.activity_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'recent') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(video.created_at) > weekAgo;
    }
    
    return video.activity_type?.toLowerCase().includes(selectedFilter);
  });

  const handleVideoPress = (video: VideoItem) => {
    if (video.status === 'completed' && video.video_url) {
      router.push({
        pathname: '/video-preview',
        params: { 
          videoUrl: video.video_url, 
          videoId: video.id,
          runId: video.id // Add runId for compatibility
        },
      });
    } else if (video.status === 'processing') {
      Alert.alert('Video Processing', 'This video is still being generated. Please check back later.');
    } else {
      Alert.alert('Video Unavailable', 'This video failed to generate or is not available.');
    }
  };

  const handleVideoOptions = (video: VideoItem) => {
    setSelectedVideo(video);
    setShowOptionsModal(true);
  };

  const handleRename = () => {
    if (selectedVideo) {
      setNewTitle(selectedVideo.title);
      setShowOptionsModal(false);
      setShowRenameModal(true);
    }
  };

  const handleRenameConfirm = async () => {
    if (selectedVideo && newTitle.trim()) {
      try {
        await updateVideoTitle(selectedVideo.id, newTitle.trim());
        setShowRenameModal(false);
        setSelectedVideo(null);
        setNewTitle('');
        await fetchVideos(); // Refresh the list
      } catch (error) {
        Alert.alert('Error', 'Failed to rename video. Please try again.');
      }
    }
  };

  const handleDelete = () => {
    if (selectedVideo) {
      Alert.alert(
        'Delete Video',
        `Are you sure you want to delete "${selectedVideo.title}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteVideo(selectedVideo.id);
                setShowOptionsModal(false);
                setSelectedVideo(null);
                await fetchVideos(); // Refresh the list
              } catch (error) {
                Alert.alert('Error', 'Failed to delete video. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  const handleShare = async () => {
    if (selectedVideo && selectedVideo.video_url) {
      try {
        await Share.share({
          message: `Check out my achievement video: ${selectedVideo.title}`,
          url: selectedVideo.video_url,
        });
        setShowOptionsModal(false);
      } catch (error) {
        if (Platform.OS === 'web' && error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            Alert.alert(
              'Sharing Not Available',
              'Sharing is not available in this browser environment. You can copy the video URL manually.'
            );
            return;
          }
        }
        Alert.alert('Error', 'Unable to share video. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'processing':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check size={16} color="#10B981" />;
      case 'processing':
        return <Clock size={16} color="#F59E0B" />;
      case 'failed':
        return <X size={16} color="#EF4444" />;
      default:
        return <Video size={16} color="#6B7280" />;
    }
  };

  const stats = getVideoStats();

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Video size={64} color="#9CA3AF" />
        <Text style={styles.authTitle}>Sign in to view your videos</Text>
        <TouchableOpacity
          style={styles.authButton}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.authButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Video Library</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewModeButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List size={24} color="#6B7280" />
            ) : (
              <Grid size={24} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Video size={20} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.totalVideos}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Check size={20} color="#10B981" />
            <Text style={styles.statValue}>{stats.completedVideos}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.processingVideos}</Text>
            <Text style={styles.statLabel}>Processing</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={20} color="#8B5CF6" />
            <Text style={styles.statValue}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersList}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonSelected,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.id && styles.filterButtonTextSelected,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Videos List */}
      <ScrollView
        style={styles.videosList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchVideos} />}
        contentContainerStyle={styles.videosContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Video size={48} color="#9CA3AF" />
            <Text style={styles.loadingText}>Loading videos...</Text>
          </View>
        ) : filteredVideos.length > 0 ? (
          <View style={[styles.videosGrid, viewMode === 'list' && styles.videosList]}>
            {filteredVideos.map((video) => (
              <TouchableOpacity
                key={video.id}
                style={[
                  styles.videoCard,
                  viewMode === 'list' && styles.videoCardList,
                ]}
                onPress={() => handleVideoPress(video)}
                activeOpacity={0.7}
              >
                {/* Thumbnail */}
                <View style={[styles.thumbnailContainer, viewMode === 'list' && styles.thumbnailContainerList]}>
                  {video.thumbnail_url ? (
                    <Image source={{ uri: video.thumbnail_url }} style={styles.thumbnail} />
                  ) : (
                    <LinearGradient
                      colors={['#3B82F6', '#1D4ED8']}
                      style={styles.thumbnailPlaceholder}
                    >
                      <Video size={viewMode === 'list' ? 20 : 32} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  
                  {/* Status Indicator */}
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(video.status) }]}>
                    {getStatusIcon(video.status)}
                  </View>

                  {/* Play Button Overlay */}
                  {video.status === 'completed' && (
                    <View style={styles.playOverlay}>
                      <View style={styles.playButton}>
                        <Play size={viewMode === 'list' ? 12 : 16} color="#FFFFFF" />
                      </View>
                    </View>
                  )}

                  {/* Duration */}
                  {video.duration && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
                    </View>
                  )}
                </View>

                {/* Video Info */}
                <View style={[styles.videoInfo, viewMode === 'list' && styles.videoInfoList]}>
                  <Text style={[styles.videoTitle, viewMode === 'list' && styles.videoTitleList]} numberOfLines={viewMode === 'list' ? 1 : 2}>
                    {video.title}
                  </Text>
                  
                  <View style={styles.videoMeta}>
                    <View style={styles.metaItem}>
                      <Calendar size={12} color="#9CA3AF" />
                      <Text style={styles.metaText}>{formatDate(video.created_at)}</Text>
                    </View>
                    
                    {video.activity_type && (
                      <View style={styles.metaItem}>
                        <Target size={12} color="#9CA3AF" />
                        <Text style={styles.metaText}>{video.activity_type}</Text>
                      </View>
                    )}
                  </View>

                  {viewMode === 'list' && (
                    <TouchableOpacity
                      style={styles.optionsButton}
                      onPress={() => handleVideoOptions(video)}
                    >
                      <MoreVertical size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Options Button for Grid View */}
                {viewMode === 'grid' && (
                  <TouchableOpacity
                    style={styles.optionsButtonGrid}
                    onPress={() => handleVideoOptions(video)}
                  >
                    <MoreVertical size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Video size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No videos found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || selectedFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Generate your first achievement video by completing an activity'}
            </Text>
            {!searchQuery && selectedFilter === 'all' && (
              <TouchableOpacity
                style={styles.createVideoButton}
                onPress={() => router.push('/manual-entry')}
              >
                <Text style={styles.createVideoButtonText}>Log Activity</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedVideo?.title}</Text>
              <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsList}>
              <TouchableOpacity style={styles.optionItem} onPress={handleRename}>
                <Edit3 size={20} color="#3B82F6" />
                <Text style={styles.optionText}>Rename</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem} onPress={handleShare}>
                <Share2 size={20} color="#10B981" />
                <Text style={styles.optionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
                <Trash2 size={20} color="#EF4444" />
                <Text style={[styles.optionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.renameModal}>
            <Text style={styles.modalTitle}>Rename Video</Text>
            
            <TextInput
              style={styles.renameInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter new title"
              autoFocus
              maxLength={100}
            />

            <View style={styles.renameActions}>
              <TouchableOpacity
                style={[styles.renameButton, styles.cancelButton]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.renameButton, styles.confirmButton]}
                onPress={handleRenameConfirm}
                disabled={!newTitle.trim()}
              >
                <Text style={styles.confirmButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewModeButton: {
    padding: 8,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filtersList: {
    paddingHorizontal: 24,
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterButtonSelected: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
  },
  videosList: {
    flex: 1,
  },
  videosContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  videosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    width: '48%',
    position: 'relative',
  },
  videoCardList: {
    width: '100%',
    flexDirection: 'row',
    padding: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  thumbnailContainerList: {
    width: 120,
    height: 68,
    borderRadius: 8,
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  videoInfo: {
    padding: 12,
  },
  videoInfoList: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  videoTitleList: {
    fontSize: 16,
    marginBottom: 4,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  optionsButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  optionsButtonGrid: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createVideoButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createVideoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  optionsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  optionsList: {
    gap: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
  },
  deleteText: {
    color: '#EF4444',
  },
  renameModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  renameActions: {
    flexDirection: 'row',
    gap: 12,
  },
  renameButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});