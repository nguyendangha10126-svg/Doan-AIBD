import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  CheckCheck 
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoryStore } from '@/store/storyStore';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Story } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';

export const ModerationQueuePage: React.FC = () => {
  const { stories, updateStoryStatus } = useStoryStore();
  const { approveStoryModeration, rejectStoryModeration, batchModeration } = useAdminStore();

  const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const cannedReasons = [
    'Hình vẽ có chi tiết sắc nhọn có thể làm trẻ nhỏ lo lắng',
    'Từ ngữ cần nhẹ nhàng và ấm áp hơn với độ tuổi bé',
    'Hình ảnh cần chụp rõ nét hơn để AI hiểu đúng nét vẽ',
    'Nội dung chưa phản ánh đúng tinh thần tích cực của tranh',
  ];

  // Filter stories
  const filteredStories = stories.filter((s) => {
    if (activeFilter === 'pending') return s.status === 'pending_review';
    if (activeFilter === 'approved') return ['auto_approved', 'approved'].includes(s.status);
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

  // Keyboard shortcuts: 'A' to Approve, 'R' to Reject
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
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
  });

  const handleApprove = async (story: Story) => {
    await updateStoryStatus(story.id, 'approved');
    approveStoryModeration(story.id, 'admin-1', 'Đã kiểm duyệt đạt chuẩn an toàn trẻ em');
    toast.success(`Đã phê duyệt câu chuyện "${story.title}"`);
  };

  const handleConfirmReject = async () => {
    if (!selectedStory || !rejectReason.trim()) return;
    await updateStoryStatus(selectedStory.id, 'rejected', rejectReason.trim());
    rejectStoryModeration(selectedStory.id, 'admin-1', rejectReason.trim());
    setIsRejectModalOpen(false);
    setRejectReason('');
    toast.info(`Đã từ chối câu chuyện "${selectedStory.title}"`);
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await updateStoryStatus(id, 'approved');
    }
    batchModeration(selectedIds, 'approved', 'Duyệt hàng loạt bởi Quản trị viên');
    toast.success(`Đã phê duyệt ${selectedIds.length} câu chuyện`);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-main">
            {vi.admin.queue.title}
          </h1>
          <p className="text-xs sm:text-sm text-main-muted mt-0.5">
            Phím tắt: bấm <kbd className="px-2 py-0.5 bg-white border border-peach/50 rounded font-mono font-bold">A</kbd> để Duyệt,{' '}
            <kbd className="px-2 py-0.5 bg-white border border-peach/50 rounded font-mono font-bold">R</kbd> để Từ chối
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-white/80 p-1.5 rounded-2xl border border-peach/40 shadow-soft">
          {[
            { id: 'pending', label: vi.admin.queue.filterPending },
            { id: 'approved', label: vi.admin.queue.filterApproved },
            { id: 'rejected', label: vi.admin.queue.filterRejected },
            { id: 'all', label: vi.admin.queue.filterAll },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all min-h-[36px] ${
                activeFilter === tab.id
                  ? 'bg-accent text-white shadow-soft'
                  : 'text-main-muted hover:text-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-white rounded-2xl border border-accent/40 shadow-soft flex items-center justify-between gap-4">
          <span className="text-xs font-heading font-bold text-main">
            Đã chọn {selectedIds.length} truyện trong hàng chờ
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {/* Queue Body */}
      {filteredStories.length === 0 ? (
        <Card variant="white" className="p-12 text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-xl font-heading font-bold text-main">
            {vi.admin.queue.emptyQueue}
          </h2>
          <p className="text-xs text-main-muted">
            Tất cả truyện tranh đã được xử lý an toàn theo quy chuẩn Responsible AI.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Stories List (Left 4 cols) */}
          <div className="lg:col-span-4 space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredStories.map((item) => {
              const isSelected = selectedStory?.id === item.id;
              const isChecked = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedStory(item)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
                    isSelected
                      ? 'bg-white border-accent shadow-soft-lg scale-101 ring-2 ring-accent/20'
                      : 'bg-white/70 border-peach/40 hover:bg-white hover:border-peach'
                  }`}
                >
                  {/* Batch Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedIds((prev) =>
                        e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                      );
                    }}
                    className="mt-1 accent-accent cursor-pointer"
                    aria-label={`Chọn truyện ${item.title}`}
                  />

                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-peach/20 shrink-0 border border-peach/30">
                    {item.drawing?.image_path ? (
                      <img
                        src={item.drawing.image_path}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        🎨
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-primary truncate">
                        {item.child?.nickname || 'Bé'} ({item.child?.age || 5}t)
                      </span>
                      <Badge
                        variant={item.risk_score > 30 ? 'warning' : 'mint'}
                        size="sm"
                      >
                        Risk: {item.risk_score}
                      </Badge>
                    </div>

                    <h4 className="font-heading font-black text-sm text-main truncate mt-0.5">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-main-muted line-clamp-1 mt-0.5">
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
              <Card variant="white" className="p-6 md:p-8 border-2 border-peach/50 space-y-6">
                {/* Header & Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-peach/30">
                  <div>
                    <h2 className="text-xl md:text-2xl font-heading font-black text-main">
                      {selectedStory.title}
                    </h2>
                    <p className="text-xs text-main-muted mt-1">
                      Tác giả nhí: <strong className="text-main">{selectedStory.child?.nickname}</strong> •{' '}
                      Mô hình: <span className="font-mono text-accent">{selectedStory.model}</span>
                    </p>
                  </div>

                  {/* Approve / Reject Controls */}
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
                  {/* Left: Original Drawing */}
                  <div className="space-y-2">
                    <span className="text-xs font-heading font-bold text-main-muted flex items-center gap-1.5">
                      <span>🎨</span> {vi.admin.queue.originalDrawing}
                    </span>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-cream-200 border-2 border-peach/40 shadow-soft">
                      {selectedStory.drawing?.image_path ? (
                        <img
                          src={selectedStory.drawing.image_path}
                          alt="Tranh gốc"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🎨
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: AI Safety Judgment & Risk Breakdown */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-cream-100 border border-peach/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-heading font-bold text-main">
                          {vi.admin.queue.aiRiskScore}
                        </span>
                        <Badge
                          variant={selectedStory.risk_score > 30 ? 'warning' : 'mint'}
                          size="md"
                        >
                          {selectedStory.risk_score} / 100
                        </Badge>
                      </div>

                      {/* Risk Reasons List */}
                      {selectedStory.risk_reasons && selectedStory.risk_reasons.length > 0 ? (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[11px] font-bold text-amber-900 block">
                            {vi.admin.queue.aiReasons}
                          </span>
                          {selectedStory.risk_reasons.map((r, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800"
                            >
                              <strong>[{r.category}]:</strong> {r.description}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-700 font-semibold pt-1">
                          ✓ AI không phát hiện rủi ro vi phạm an toàn.
                        </p>
                      )}
                    </div>

                    {/* Moral */}
                    <div className="p-3.5 rounded-2xl bg-peach/20 border border-peach/40 text-xs text-main">
                      <strong className="block mb-0.5">Bài học giáo dục (Moral):</strong>
                      <span>{selectedStory.moral}</span>
                    </div>
                  </div>
                </div>

                {/* Story Pages Content */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-heading font-bold text-main">
                    Nội dung 4-5 trang truyện:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(selectedStory.pages || []).map((page) => (
                      <div
                        key={page.id}
                        className="p-3.5 rounded-2xl bg-cream-100 border border-peach/30 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-primary font-bold">
                          <span>Trang {page.page_number}</span>
                          <span className="text-main-muted font-normal text-[11px]">
                            Cảm xúc: {page.emotion}
                          </span>
                        </div>
                        <p className="text-main leading-relaxed">
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
        title="Từ chối phê duyệt truyện"
        description="Chọn lý do mẫu hoặc nhập lý do sư phạm để thông báo nhẹ nhàng đến phụ huynh"
      >
        <div className="space-y-4 pt-2">
          {/* Canned Reasons */}
          <div>
            <label className="block text-xs font-heading font-bold text-main mb-1.5">
              {vi.admin.queue.cannedReasons}
            </label>
            <div className="space-y-1.5">
              {cannedReasons.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                    rejectReason === reason
                      ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
                      : 'bg-cream-100 border-peach/30 text-main hover:bg-white'
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

          <div className="flex justify-end gap-2 pt-2 border-t border-peach/30">
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
