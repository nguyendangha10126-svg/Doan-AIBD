import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';
import { formatChildName } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { BookCover } from '@/components/ui/BookCover';
import { EmptyState } from '@/components/ui/EmptyState';
import { Story, isStoryApproved } from '@/types/database';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { stories, deleteStory, toggleStoryShare, fetchStories } = useStoryStore();
  const { childrenList } = useAuthStore();

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChildFilter, setSelectedChildFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const myChildIds = new Set(childrenList.map((c) => c.id));

  useEffect(() => {
    if (selectedChildFilter !== 'all' && !childrenList.some((c) => c.id === selectedChildFilter)) {
      setSelectedChildFilter('all');
    }
  }, [childrenList, selectedChildFilter]);

  // Filter logic (strictly scoped to own children)
  const filteredStories = stories.filter((story) => {
    if (!myChildIds.has(story.child_id)) {
      return false;
    }
    // Child filter
    if (selectedChildFilter !== 'all' && story.child_id !== selectedChildFilter) {
      return false;
    }
    // Status filter
    if (selectedStatusFilter !== 'all') {
      if (selectedStatusFilter === 'approved' && !isStoryApproved(story.status)) {
        return false;
      }
      if (selectedStatusFilter === 'pending' && story.status !== 'pending_review') {
        return false;
      }
      if (selectedStatusFilter === 'rejected' && story.status !== 'rejected') {
        return false;
      }
    }
    // Favorites filter
    if (onlyFavorites && !story.is_shared) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = story.title.toLowerCase().includes(q);
      const matchMoral = story.moral?.toLowerCase().includes(q);
      const matchSummary = story.summary?.toLowerCase().includes(q);
      return matchTitle || matchMoral || matchSummary;
    }
    return true;
  });

  const handleDeleteStory = async (storyId: string) => {
    const ok = await deleteStory(storyId);
    if (ok) {
      toast.success('Đã xóa câu chuyện khỏi tủ sách');
    } else {
      toast.error('Không thể xóa câu chuyện. Vui lòng thử lại.');
    }
  };

  const handleShareStory = async (story: Story) => {
    if (!isStoryApproved(story.status)) {
      toast.error('Chỉ có thể chia sẻ công khai truyện đã được duyệt.');
      return;
    }
    if (!story.is_shared) {
      const ok = await toggleStoryShare(story.id, true);
      if (!ok) {
        toast.error('Không thể bật liên kết chia sẻ lúc này.');
        return;
      }
    }
    await navigator.clipboard?.writeText(`${window.location.origin}/shared/${story.share_token}`);
    toast.success('Đã bật chia sẻ và sao chép liên kết công khai!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight">
            Tủ Sách Gia Đình
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Nơi lưu giữ từng ấn bản truyện tranh được dệt nên từ nét vẽ tuổi thơ của các con.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/create')}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Sáng tác truyện mới
        </Button>
      </div>

      {/* Filter Chips & Search Toolbar */}
      <div className="bg-surface p-4 sm:p-5 rounded-[28px] border border-ink/10 shadow-card space-y-4">
        
        {/* Search Bar */}
        <div className="max-w-md">
          <Input
            placeholder="Tìm theo tên truyện, nhân vật, bài học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-ink-faint" />}
          />
        </div>

        {/* Filter Chips Section */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-ink/10">
          <span className="text-xs font-heading font-bold text-ink-faint mr-1">
            Hồ sơ bé:
          </span>

          <Chip
            selected={selectedChildFilter === 'all'}
            onClick={() => setSelectedChildFilter('all')}
          >
            Tất cả các bé
          </Chip>

          {childrenList.map((kid) => (
            <Chip
              key={kid.id}
              selected={selectedChildFilter === kid.id}
              onClick={() => setSelectedChildFilter(kid.id)}
              icon={<span>{kid.avatar_emoji}</span>}
            >
              {formatChildName(kid.nickname)}
            </Chip>
          ))}
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-ink/10">
          <span className="text-xs font-heading font-bold text-ink-faint mr-1">
            Trạng thái:
          </span>

          <Chip
            selected={selectedStatusFilter === 'all'}
            onClick={() => setSelectedStatusFilter('all')}
          >
            Tất cả trạng thái
          </Chip>

          <Chip
            selected={selectedStatusFilter === 'approved'}
            onClick={() => setSelectedStatusFilter('approved')}
            icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#166E48]" />}
          >
            Đã duyệt
          </Chip>

          <Chip
            selected={selectedStatusFilter === 'pending'}
            onClick={() => setSelectedStatusFilter('pending')}
            icon={<Clock className="w-3.5 h-3.5 text-amber-600" />}
          >
            Đang chờ duyệt
          </Chip>

          <Chip
            selected={selectedStatusFilter === 'rejected'}
            onClick={() => setSelectedStatusFilter('rejected')}
            icon={<AlertTriangle className="w-3.5 h-3.5 text-[#B42343]" />}
          >
            Cần vẽ lại
          </Chip>

          <Chip
            selected={onlyFavorites}
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            icon={<Share2 className="w-3.5 h-3.5 text-brand-600" />}
          >
            Đang chia sẻ
          </Chip>

          {(selectedChildFilter !== 'all' || selectedStatusFilter !== 'all' || onlyFavorites || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedChildFilter('all');
                setSelectedStatusFilter('all');
                setOnlyFavorites(false);
                setSearchQuery('');
              }}
              className="text-xs font-heading font-bold text-brand-600 hover:underline flex items-center gap-1 ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Stories Grid with Wood Shelf Styling */}
      {filteredStories.length === 0 ? (
        <EmptyState
          title="Không tìm thấy cuốn sách nào"
          description="Không có câu chuyện nào phù hợp với bộ lọc hiện tại. Thử xóa bộ lọc hoặc sáng tác câu chuyện mới nhé!"
          actionText="Sáng tác truyện ngay"
          onAction={() => navigate('/create')}
        />
      ) : (
        <div className="relative">
          {/* Responsive Grid 1/2/3/4 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-6">
            {filteredStories.map((story) => (
              <div key={story.id} className="relative">
                <BookCover
                  story={story}
                  onRead={(id) => navigate(`/story/${id}`)}
                  onDelete={handleDeleteStory}
                  onShare={handleShareStory}
                />
              </div>
            ))}
          </div>

          {/* Thin Wooden Shelf Line Accent */}
          <div className="w-full h-3 bg-gradient-to-r from-[#D7A97E] via-[#F2D0A9] to-[#D7A97E] rounded-full shadow-xs border-b-2 border-[#B8875A]/60 -mt-2" />
        </div>
      )}
    </div>
  );
};
