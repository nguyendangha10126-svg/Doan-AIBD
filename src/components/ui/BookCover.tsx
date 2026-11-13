import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  MoreVertical, 
  Trash2, 
  Share2, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Story, isStoryApproved } from '@/types/database';
import { Badge } from './Badge';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

export interface BookCoverProps {
  story: Story;
  onRead?: (storyId: string) => void;
  onDelete?: (storyId: string) => Promise<boolean | void>;
  onShare?: (story: Story) => void;
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  story,
  onRead,
  onDelete,
  onShare,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isApproved = isStoryApproved(story.status);
  const isPending = story.status === 'pending_review';
  const isRejected = story.status === 'rejected';

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(story.id);
      setIsConfirmDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div 
        className={`group relative rounded-[28px] bg-surface border border-ink/10 shadow-card p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-pop ${className}`}
      >
        {/* Book Cover Visual (3:4 ratio) */}
        <div 
          className="relative aspect-[3/4] w-full rounded-[22px] overflow-hidden bg-surface-2 shadow-xs cursor-pointer select-none"
          onClick={() => isApproved && onRead?.(story.id)}
        >
          {/* Cover Artwork Image */}
          {story.drawing?.image_path ? (
            <img
              src={story.drawing.image_path}
              alt={story.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-4xl bg-brand-100/30 text-ink-faint">
              <span>🎨</span>
            </div>
          )}

          {/* Book Spine Shadow Effect (Left Gradient) */}
          <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/35 via-black/15 to-transparent z-10 pointer-events-none" />

          {/* Corner Status Pill */}
          <div className="absolute top-2.5 right-2.5 z-20">
            {isApproved && (
              <Badge variant="success" size="sm">
                Đã duyệt
              </Badge>
            )}
            {isPending && (
              <Badge variant="warning" size="sm">
                Đang duyệt
              </Badge>
            )}
            {isRejected && (
              <Badge variant="danger" size="sm">
                Cần vẽ lại
              </Badge>
            )}
          </div>

          {/* Title on Blurred Bottom Strip */}
          <div className="absolute inset-x-0 bottom-0 p-3.5 pt-8 bg-gradient-to-t from-black/90 via-black/55 to-transparent text-white z-20">
            <h3 className="font-heading font-extrabold text-sm sm:text-base leading-tight line-clamp-2 text-white drop-shadow-sm">
              {story.title}
            </h3>
            {story.child && (
              <span className="text-[11px] text-white/80 block mt-0.5 truncate font-medium">
                Tác giả nhí: {story.child.nickname} ({story.child.age}t)
              </span>
            )}
          </div>
        </div>

        {/* Content Body Below Cover */}
        <div className="pt-3 px-1 flex-1 flex flex-col justify-between">
          {isApproved && (
            <div className="space-y-1.5">
              <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed">
                {story.summary}
              </p>
            </div>
          )}

          {isPending && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/70 space-y-2 mt-1">
              <div className="flex items-center justify-between text-xs font-heading font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  Đang chờ duyệt
                </span>
                <span className="text-[11px] text-amber-700">75%</span>
              </div>
              <div className="w-full bg-amber-200/80 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-full w-3/4 rounded-full animate-pulse" />
              </div>
              <p className="text-[10px] text-amber-800 leading-tight">
                Ban An Toàn AI đang thẩm định ngôn từ trước khi mở cho bé đọc.
              </p>
            </div>
          )}

          {isRejected && (
            <div className="p-2.5 rounded-2xl bg-[#FFE3EA] border border-[#B42343]/20 space-y-1 mt-1 text-left">
              <div className="flex items-center gap-1 text-[11px] font-heading font-bold text-[#B42343]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Lý do từ chối:</span>
              </div>
              <p className="text-[11px] text-[#B42343] line-clamp-2 leading-tight">
                {story.rejection_reason || 'Ảnh chưa nhận diện rõ nét vẽ tay của bé, hãy thử chụp lại nhé.'}
              </p>
            </div>
          )}

          {/* Footer: Page Count, Read CTA & Actions Menu */}
          <div className="mt-3 pt-2.5 border-t border-ink/10 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-ink-faint shrink-0">
              {story.pages?.length || 4} trang
            </span>

            <div className="flex items-center gap-1">
              {/* Primary Read CTA */}
              {isApproved && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onRead?.(story.id)}
                  leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                >
                  Đọc
                </Button>
              )}

              {/* Three Dots Menu */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1.5 rounded-full hover:bg-ink/5 text-ink-faint hover:text-ink transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                  aria-label="Tùy chọn sách"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 6 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 bottom-full mb-1 w-44 bg-surface border border-ink/10 rounded-2xl shadow-pop p-1.5 z-30 space-y-0.5"
                    >
                      {isApproved && onShare && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onShare(story);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-bold text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5 text-brand-600" />
                          <span>Chia sẻ truyện</span>
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsConfirmDeleteOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-bold text-[#B42343] hover:bg-[#FFE3EA] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa truyện này</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Xóa câu chuyện tranh này?"
        description={`Bạn có chắc chắn muốn xóa "${story.title}"? Câu chuyện và toàn bộ các trang tranh sẽ bị xóa vĩnh viễn khỏi tủ sách gia đình.`}
        confirmText="Xác nhận xóa"
        cancelText="Giữ lại"
      />
    </>
  );
};
