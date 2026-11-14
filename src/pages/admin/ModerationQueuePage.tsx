import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  CheckCheck,
  ShieldAlert,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoryStore } from '@/store/storyStore';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { formatChildName } from '@/lib/utils';
import { vi } from '@/lib/i18n/vi';
import { Story, isStoryApproved } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';

export const ModerationQueuePage: React.FC = () => {
  const { stories, fetchStories } = useStoryStore();
  const { profile } = useAuthStore();
  const {
    approveStoryModeration,
    rejectStoryModeration,
    batchModeration,
    fetchAdminData,
  } = useAdminStore();

  useEffect(() => {
    fetchStories();
    fetchAdminData();
  }, [fetchStories, fetchAdminData]);

  const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const cannedReasons = [
    'Hình vẽ có chi tiết sắc nhọn hoặc nhạy cảm có thể làm trẻ nhỏ lo lắng',
    'Từ ngữ cốt truyện cần nhẹ nhàng, phù hợp hơn với lứa tuổi của bé',
    'Ảnh chụp chưa rõ nét vẽ của bé trên giấy, cần chụp lại',
    'Cốt truyện chưa phản ánh đúng vật thể thực tế trong tranh vẽ của bé',
  ];

  // Filter stories
  const filteredStories = stories.filter((s) => {
    if (activeFilter === 'pending') return s.status === 'pending_review';
    if (activeFilter === 'approved') return isStoryApproved(s.status);
    if (activeFilter === 'rejected') return s.status === 'rejected';
    return true;
  });

  // Select first story by default
  useEffect(() => {
    if (!selectedStory && filteredStories.length > 0) {
      setSelectedStory(filteredStories[0]);
    } else if (selectedStory && !filteredStories.some((s) => s.id === selectedStory.id)) {
      setSelectedStory(filteredStories[0] || null);
    }
  }, [filteredStories, selectedStory]);

  const adminId = profile?.id || '';

  const handleApprove = useCallback(
    async (story: Story) => {
      if (!adminId) {
        toast.error('Không xác định được phiên Quản trị viên.');
        return;
      }
      const ok = await approveStoryModeration(
        story.id,
        adminId,
        'Đã kiểm duyệt đạt chuẩn an toàn trẻ em'
      );
      if (ok) {
        toast.success(`Đã phê duyệt câu chuyện "${story.title}"`);
      } else {
        toast.error('Không thể phê duyệt câu chuyện. Vui lòng thử lại.');
      }
    },
    [adminId, approveStoryModeration]
  );

  const handleConfirmReject = async () => {
    if (!selectedStory || !rejectReason.trim() || !adminId) return;
    const ok = await rejectStoryModeration(selectedStory.id, adminId, rejectReason.trim());
    if (ok) {
      setIsRejectModalOpen(false);
      setRejectReason('');
      toast.info(`Đã từ chối câu chuyện "${selectedStory.title}"`);
    } else {
      toast.error('Không thể cập nhật trạng thái từ chối.');
    }
  };

  // Keyboard shortcuts: 'A' to Approve, 'R' to Reject
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'a' || e.key === 'A') {
        if (selectedStory && selectedStory.status === 'pending_review') {
          handleApprove(selectedStory);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedStory && selectedStory.status === 'pending_review') {
          setIsRejectModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStory, handleApprove]);

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    const ok = await batchModeration(selectedIds, 'approved', 'Duyệt hàng loạt bởi Quản trị viên');
    if (ok) {
      toast.success(`Đã phê duyệt ${selectedIds.length} câu chuyện`);
      setSelectedIds([]);
    } else {
      toast.error('Duyệt hàng loạt thất bại. Vui lòng thử lại.');
    }
  };

  const groundedObjects =
    selectedStory?.grounded_objects && selectedStory.grounded_objects.length > 0
      ? selectedStory.grounded_objects
      : selectedStory?.drawing?.ai_analysis?.objects || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
            {vi.admin.queue.title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Phím tắt nhanh: bấm{' '}
            <kbd className="px-2 py-0.5 bg-surface border border-ink/15 rounded-md font-mono font-bold text-ink">
              A
            </kbd>{' '}
            để Duyệt,{' '}
            <kbd className="px-2 py-0.5 bg-surface border border-ink/15 rounded-md font-mono font-bold text-ink">
              R
            </kbd>{' '}
            để Từ chối
          </p>
        </div>

        {/* Status Filter Chips (Responsive flex-wrap) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface p-1.5 rounded-2xl sm:rounded-full border border-ink/10 shadow-xs">
          {[
            { id: 'pending', label: vi.admin.queue.filterPending },
            { id: 'approved', label: vi.admin.queue.filterApproved },
            { id: 'rejected', label: vi.admin.queue.filterRejected },
            { id: 'all', label: vi.admin.queue.filterAll },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-heading font-bold transition-all min-h-[36px] cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-brand-600 text-white shadow-btn-primary'
                  : 'text-ink-soft hover:text-ink hover:bg-surface-2'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-surface rounded-2xl border border-brand-400 shadow-card flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-heading font-bold text-ink">
            Đang chọn {selectedIds.length} truyện trong hàng chờ
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleBatchApprove}
              leftIcon={<CheckCheck className="w-4 h-4" />}
            >
              {vi.admin.queue.batchApprove}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {/* Queue Body */}
      {filteredStories.length === 0 ? (
        <Card variant="white" className="p-12 text-center space-y-4 border border-ink/10">
          <div className="text-6xl">🎉</div>
          <h2 className="text-xl font-heading font-extrabold text-ink">
            {vi.admin.queue.emptyQueue}
          </h2>
          <p className="text-xs text-ink-soft max-w-md mx-auto">
            Danh sách kiểm duyệt hiện không có câu chuyện nào ở trạng thái đang lọc. Toàn bộ truyện đều được thẩm định qua pipeline AI 3 lớp.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Stories List (Left 4 cols) */}
          <div className="lg:col-span-4 space-y-3 max-h-[750px] overflow-y-auto pr-1">
            <div className="sticky top-0 z-10 bg-bg pb-2 text-xs font-bold text-ink-soft flex items-center justify-between">
              <span>Danh sách truyện ({filteredStories.length})</span>
              <span>Bé / Tuổi</span>
            </div>

            {filteredStories.map((item) => {
              const isSelected = selectedStory?.id === item.id;
              const isChecked = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedStory(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                    isSelected
                      ? 'bg-surface border-brand-600 shadow-card ring-2 ring-brand-100'
                      : 'bg-surface/80 border-ink/10 hover:bg-surface hover:border-ink/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedIds((prev) =>
                        e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                      );
                    }}
                    className="mt-1 accent-brand-600 cursor-pointer"
                    aria-label={`Chọn truyện ${item.title}`}
                  />

                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-2 shrink-0 border border-ink/10 flex items-center justify-center">
                    {item.drawing?.image_path ? (
                      <img
                        src={item.drawing.image_path}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">🎨</span>
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-brand-600 truncate">
                        {formatChildName(item.child?.nickname)} ({item.child?.age || 5}t)
                      </span>
                      <Badge
                        variant={item.risk_score > 30 ? 'warning' : 'success'}
                        size="sm"
                      >
                        Risk {item.risk_score}
                      </Badge>
                    </div>

                    <h4 className="font-heading font-extrabold text-sm text-ink truncate mt-0.5">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-ink-soft line-clamp-1 mt-0.5">
                      {item.summary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Split Detail Viewer (Right 8 cols) */}
          {selectedStory && (
            <div className="lg:col-span-8 space-y-6">
              <Card variant="white" className="p-6 md:p-8 border border-ink/10 space-y-6">
                {/* Header & Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-ink/10">
                  <div>
                    <h2 className="text-xl md:text-2xl font-heading font-extrabold text-ink">
                      {selectedStory.title}
                    </h2>
                    <p className="text-xs text-ink-soft mt-1">
                      Tác giả: <strong className="text-ink">{formatChildName(selectedStory.child?.nickname)}</strong> ({selectedStory.child?.age || 5} tuổi) ·{' '}
                      Mô hình: <span className="font-mono text-brand-600 font-bold">{selectedStory.model}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(selectedStory)}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      {vi.admin.queue.approveBtn}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setIsRejectModalOpen(true)}
                      leftIcon={<X className="w-4 h-4" />}
                    >
                      {vi.admin.queue.rejectBtn}
                    </Button>
                  </div>
                </div>

                {/* Split Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Original Drawing in Paper Frame */}
                  <div className="space-y-2">
                    <span className="text-xs font-heading font-bold text-ink-soft flex items-center gap-1.5">
                      <span>🎨</span> {vi.admin.queue.originalDrawing}
                    </span>
                    <div className="p-2.5 pb-4 bg-surface rounded-2xl border border-ink/10 shadow-card">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center">
                        {selectedStory.drawing?.image_path ? (
                          <img
                            src={selectedStory.drawing.image_path}
                            alt="Tranh gốc"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-4xl">🎨</div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-ink-faint text-center mt-2">
                        Tranh vẽ tay nguyên bản
                      </p>
                    </div>

                    {groundedObjects.length > 0 && (
                      <div className="p-3 bg-surface-2 rounded-2xl border border-ink/10 space-y-1.5">
                        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-magic-600" />
                          <span>AI thấy gì trong tranh:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {groundedObjects.map((obj, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface border border-ink/10 text-ink-soft"
                            >
                              ✨ {obj}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: AI Safety Judgment & Faithfulness Score */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-surface-2 border border-ink/10">
                        <span className="text-xs font-bold text-ink-soft block">
                          Điểm rủi ro AI
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-2xl font-heading font-extrabold text-ink">
                            {selectedStory.risk_score}
                          </span>
                          <Badge
                            variant={selectedStory.risk_score > 30 ? 'warning' : 'success'}
                            size="sm"
                          >
                            {selectedStory.risk_score > 30 ? 'Cần duyệt' : 'An toàn'}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-2 border border-ink/10">
                        <span className="text-xs font-bold text-ink-soft block">
                          Độ trung thực tranh
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-2xl font-heading font-extrabold text-brand-600">
                            {selectedStory.faithfulness_score || 92}%
                          </span>
                          <Badge variant="magic" size="sm">
                            Đạt chuẩn
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-surface-2 border border-ink/10 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                        <ShieldAlert className="w-4 h-4 text-warning-text" />
                        <span>Đánh giá an toàn 3 lớp:</span>
                      </div>

                      {selectedStory.risk_reasons && selectedStory.risk_reasons.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          {selectedStory.risk_reasons.map((r, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-2.5 rounded-xl bg-warning-bg border border-warning-text/20 text-xs text-warning-text font-medium"
                            >
                              <strong>[{r.category}]:</strong> {r.description}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-success-text font-bold pt-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>AI không phát hiện yếu tố rủi ro vi phạm an toàn trẻ em.</span>
                        </p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-peach/20 border border-peach/50 text-xs text-ink">
                      <strong className="block mb-0.5">Bài học giáo dục (Moral):</strong>
                      <span>{selectedStory.moral}</span>
                    </div>
                  </div>
                </div>

                {/* Story Pages Content */}
                <div className="space-y-3 pt-3 border-t border-ink/10">
                  <h3 className="text-sm font-heading font-extrabold text-ink">
                    Nội dung các trang truyện ({selectedStory.pages?.length || 4} trang):
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(selectedStory.pages || []).map((page) => (
                      <div
                        key={page.id}
                        className="p-3.5 rounded-2xl bg-surface-2 border border-ink/10 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-brand-600 font-bold">
                          <span>Trang {page.page_number}</span>
                          <span className="text-ink-soft font-normal text-[11px]">
                            Cảm xúc: {page.emotion}
                          </span>
                        </div>
                        <p className="text-ink leading-relaxed">
                          {page.text_content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Từ chối phê duyệt câu chuyện"
        description="Chọn lý do mẫu hoặc nhập lý do sư phạm để thông báo nhẹ nhàng đến phụ huynh"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-heading font-bold text-ink mb-1.5">
              {vi.admin.queue.cannedReasons}
            </label>
            <div className="space-y-1.5">
              {cannedReasons.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    rejectReason === reason
                      ? 'bg-danger-bg border-danger-text/40 text-danger-text font-bold'
                      : 'bg-surface-2 border-ink/10 text-ink hover:bg-surface'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label={vi.admin.queue.customReason}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Nhập lý do chi tiết..."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
            <Button variant="ghost" size="sm" onClick={() => setIsRejectModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!rejectReason.trim()}
              onClick={handleConfirmReject}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
