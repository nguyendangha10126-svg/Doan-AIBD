import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  Filter, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { Story } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { stories, deleteStory } = useStoryStore();
  const { childrenList } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChildFilter, setSelectedChildFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);

  // Filter logic
  const filteredStories = stories.filter((story) => {
    // Child filter
    if (selectedChildFilter !== 'all' && story.child_id !== selectedChildFilter) {
      return false;
    }
    // Status filter
    if (selectedStatusFilter !== 'all') {
      if (selectedStatusFilter === 'approved' && !['auto_approved', 'approved'].includes(story.status)) {
        return false;
      }
      if (selectedStatusFilter === 'pending' && story.status !== 'pending_review') {
        return false;
      }
      if (selectedStatusFilter === 'rejected' && story.status !== 'rejected') {
        return false;
      }
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = story.title.toLowerCase().includes(q);
      const matchMoral = story.moral.toLowerCase().includes(q);
      const matchSummary = story.summary.toLowerCase().includes(q);
      return matchTitle || matchMoral || matchSummary;
    }
    return true;
  });

  const handleDeleteConfirmed = async () => {
    if (!storyToDelete) return;
    const ok = await deleteStory(storyToDelete.id);
    if (ok) {
      toast.success(vi.library.deleteSuccess);
      setStoryToDelete(null);
    } else {
      toast.error('Không thể xóa truyện');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-main">
            {vi.library.title}
          </h1>
          <p className="text-xs sm:text-sm text-main-muted mt-1">
            {vi.library.subtitle}
          </p>
        </div>

        <Link to="/create">
          <Button variant="primary" size="md" leftIcon={<Sparkles className="w-4 h-4" />}>
            {vi.dashboard.ctaCreateStory}
          </Button>
        </Link>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white/80 p-4 rounded-3xl border border-peach/50 shadow-soft flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-main-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={vi.library.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-cream-100 border border-peach/40 text-xs md:text-sm text-main placeholder:text-main-muted focus:outline-none focus:border-primary min-h-[44px]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Child Filter */}
          <div className="flex items-center gap-1.5 bg-cream-100 px-3 py-1.5 rounded-2xl border border-peach/40 min-h-[44px]">
            <Filter className="w-3.5 h-3.5 text-main-muted" />
            <select
              value={selectedChildFilter}
              onChange={(e) => setSelectedChildFilter(e.target.value)}
              className="bg-transparent text-xs font-heading font-bold text-main focus:outline-none cursor-pointer"
            >
              <option value="all">{vi.library.filterAllChildren}</option>
              {childrenList.map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {kid.nickname} ({kid.age}t)
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-cream-100 px-3 py-1.5 rounded-2xl border border-peach/40 min-h-[44px]">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-heading font-bold text-main focus:outline-none cursor-pointer"
            >
              <option value="all">{vi.library.filterAllStatus}</option>
              <option value="approved">Đã sẵn sàng đọc</option>
              <option value="pending">Đang chờ duyệt</option>
              <option value="rejected">Cần vẽ lại</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <EmptyState
          title={vi.library.emptySearch}
          description="Hãy thử thay đổi từ khóa tìm kiếm hoặc tạo một câu chuyện mới cho bé!"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedChildFilter('all');
                setSelectedStatusFilter('all');
              }}
            >
              Xóa bộ lọc
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => {
            const isApproved = ['auto_approved', 'approved'].includes(story.status);
            const isPending = story.status === 'pending_review';
            const isRejected = story.status === 'rejected';

            return (
              <Card
                key={story.id}
                variant="white"
                className="flex flex-col justify-between border-2 border-peach/50 p-5 group"
              >
                <div className="space-y-3">
                  {/* Image Cover */}
                  <div
                    onClick={() => {
                      if (isApproved) navigate(`/story/${story.id}`);
                    }}
                    className={`aspect-[4/3] rounded-2xl overflow-hidden bg-cream-200 relative border border-peach/40 shadow-soft-inner ${
                      isApproved ? 'cursor-pointer' : ''
                    }`}
                  >
                    {story.drawing?.image_path ? (
                      <img
                        src={story.drawing.image_path}
                        alt={story.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        🎨
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {isApproved && (
                        <Badge variant="mint" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Đã duyệt
                        </Badge>
                      )}
                      {isPending && (
                        <Badge variant="warning" size="sm">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Chờ duyệt
                        </Badge>
                      )}
                      {isRejected && (
                        <Badge variant="danger" size="sm">
                          Cần sửa
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3
                      onClick={() => {
                        if (isApproved) navigate(`/story/${story.id}`);
                      }}
                      className={`text-lg font-heading font-black text-main line-clamp-1 ${
                        isApproved ? 'cursor-pointer hover:text-primary transition-colors' : ''
                      }`}
                    >
                      {story.title}
                    </h3>
                    <p className="text-xs text-main-muted mt-1 line-clamp-2 leading-relaxed">
                      {story.summary}
                    </p>
                  </div>

                  {/* Moral */}
                  <div className="p-2.5 rounded-xl bg-peach/20 border border-peach/30 text-[11px] font-semibold text-main line-clamp-1">
                    💡 {story.moral}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-peach/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isApproved && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/story/${story.id}`)}
                        leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Đọc
                      </Button>
                    )}

                    <button
                      onClick={() => setStoryToDelete(story)}
                      className="p-2 rounded-xl text-main-muted hover:text-rose-500 hover:bg-rose-50 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title={vi.library.deleteButton}
                      aria-label={vi.library.deleteButton}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[11px] text-main-muted font-bold">
                    {story.pages?.length || 4} trang
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(storyToDelete)}
        onClose={() => setStoryToDelete(null)}
        title={vi.library.deleteConfirmTitle}
        description={vi.library.deleteConfirmDesc}
        maxWidth="sm"
      >
        <div className="pt-4 flex justify-end gap-2 border-t border-peach/30">
          <Button variant="ghost" size="sm" onClick={() => setStoryToDelete(null)}>
            {vi.library.cancelButton}
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteConfirmed}>
            {vi.library.deleteButton}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
