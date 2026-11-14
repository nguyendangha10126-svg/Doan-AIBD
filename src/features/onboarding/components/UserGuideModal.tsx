import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Eye,
  Check,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Smile,
  LayoutDashboard,
  ClipboardCheck,
  Terminal,
  Lock,
} from 'lucide-react';
import { UserRole } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  getGuideNeverShowKey,
  markUserGuideSeenForSession,
} from '@/features/onboarding/utils/userGuideStorage';

export interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: UserRole;
  userId?: string | null;
}

interface GuideSlide {
  shortLabel: string;
  badge: string;
  emoji: string;
  accentBg: string;
  icon: React.ElementType;
  title: string;
  description: string;
  tips: string[];
}

const PARENT_SLIDES: GuideSlide[] = [
  {
    shortLabel: 'Hồ sơ của bé',
    badge: 'Bước 1 • Khởi tạo an toàn',
    emoji: '🥑',
    accentBg: 'bg-mint/45',
    icon: Sparkles,
    title: 'Tạo hồ sơ riêng cho từng bé yêu',
    description:
      'DrawToStory tuân thủ nguyên tắc tối thiểu hóa dữ liệu trẻ em: chỉ dùng biệt danh thân mật (ví dụ: Bơ, Sóc) và độ tuổi để điều chỉnh từ vựng phù hợp.',
    tips: [
      'Bấm "Thêm hồ sơ bé" ngay tại Trang chủ hoặc mục Cài đặt.',
      'Chuyển đổi nhanh giữa các bé ở thanh chọn góc trên cùng mà không mất truyện.',
      'Mỗi bé có bộ sưu tập huy hiệu và chuỗi ngày sáng tạo riêng.',
    ],
  },
  {
    shortLabel: 'Tạo truyện từ tranh',
    badge: 'Bước 2 • AI 3 lớp bảo vệ',
    emoji: '🎨',
    accentBg: 'bg-peach/50',
    icon: ShieldCheck,
    title: 'Chụp nét vẽ trên giấy — Hóa sách cổ tích',
    description:
      'Chỉ cần chụp rõ trang giấy vẽ của con. Máy chủ AI thực thi 3 lớp: Kiểm định ảnh đầu vào → Dệt truyện bám sát 100% chi tiết tranh → Giám định độ an toàn.',
    tips: [
      'Chỉ chụp phần giấy vẽ, tránh chụp khuôn mặt thật hoặc số điện thoại/địa chỉ.',
      'AI chỉ kể về đúng những nhân vật, đồ vật, màu sắc thật sự có trong nét vẽ.',
      'Truyện an toàn sẽ nhận con dấu Kiểm định xanh và mở đọc ngay lập tức.',
    ],
  },
  {
    shortLabel: 'Đọc, Nghe & In PDF',
    badge: 'Bước 3 • Trải nghiệm đọc sách',
    emoji: '📖',
    accentBg: 'bg-butter/60',
    icon: BookOpen,
    title: 'Lật trang sách, nghe kể chuyện & xuất bản PDF',
    description:
      'Mỗi trang truyện tự động thu phóng mượt mà vào đúng vùng nét vẽ tương ứng của con, kết hợp giọng đọc tiếng Việt ấm áp và gợi ý vẽ tiếp.',
    tips: [
      'Tùy chỉnh 3 mức cỡ chữ, bật/tắt giọng đọc tự động hoặc chế độ toàn màn hình.',
      'Tải bản in PDF chất lượng cao để đóng thành cuốn sách kỷ niệm tuổi thơ.',
      'Tạo liên kết chia sẻ an toàn cho Ông Bà xem (có thể tắt chia sẻ bất cứ lúc nào).',
    ],
  },
  {
    shortLabel: 'Chế độ Bé & PIN',
    badge: 'Bước 4 • Cổng phụ huynh',
    emoji: '🛡️',
    accentBg: 'bg-lavender/55',
    icon: Smile,
    title: 'Chế độ Bé độc lập & Khóa PIN Phụ huynh',
    description:
      'Khi đưa thiết bị cho con tự đọc sách, hãy bật Chế độ Bé để ẩn toàn bộ thanh cài đặt, xóa dữ liệu và điều hướng bên ngoài.',
    tips: [
      'Vào Cài đặt → Cổng Phụ Huynh để đặt mã PIN 4 chữ số bí mật của riêng gia đình.',
      'Muốn thoát khỏi Chế độ Bé cần nhập đúng mã PIN hoặc giải phép tính nhân người lớn.',
      'Bạn luôn có thể xem lại hướng dẫn này ở menu tài khoản (ngay trên nút Đăng xuất).',
    ],
  },
];

const ADMIN_SLIDES: GuideSlide[] = [
  {
    shortLabel: 'Tổng quan & KPIs',
    badge: 'Quản trị 1 • Giám sát trực quan',
    emoji: '📊',
    accentBg: 'bg-sky/50',
    icon: LayoutDashboard,
    title: 'Bảng điều khiển An toàn & Chi phí AI thực tế',
    description:
      'Theo dõi toàn diện số truyện tạo trong ngày, tỷ lệ chặn vi phạm, hàng đợi cần duyệt, độ đồng thuận AI–Admin và ngân sách token theo tháng.',
    tips: [
      'Chuyển đổi linh hoạt biểu đồ 7 ngày và 30 ngày đồng bộ trực tiếp từ cơ sở dữ liệu.',
      'Xuất báo cáo nhật ký vận hành AI ra tệp CSV phục vụ kiểm toán chi phí.',
      'Cảnh báo sớm khi chi phí token tiến gần ngưỡng ngân sách tháng đã đặt.',
    ],
  },
  {
    shortLabel: 'Duyệt truyện & Đối chiếu',
    badge: 'Quản trị 2 • Kiểm duyệt con người',
    emoji: '🔍',
    accentBg: 'bg-peach/50',
    icon: ClipboardCheck,
    title: 'Hàng đợi Kiểm duyệt đặt cạnh tranh vẽ gốc',
    description:
      'Mọi truyện có điểm rủi ro trung bình hoặc độ bám sát tranh thấp đều được giữ tại hàng đợi để Quản trị viên thẩm định trước khi hiển thị cho trẻ.',
    tips: [
      'Xem song song tranh gốc của bé, vật thể AI nhận diện và nội dung từng trang.',
      'Hỗ trợ duyệt nhanh hoặc từ chối hàng loạt kèm lý do phản hồi rõ ràng.',
      'Mọi quyết định duyệt/từ chối đều được ghi nhận vào bảng đối sánh AI–Admin.',
    ],
  },
  {
    shortLabel: 'Quy tắc & Prompt AI',
    badge: 'Quản trị 3 • Tinh chỉnh mô hình',
    emoji: '🧪',
    accentBg: 'bg-mint/45',
    icon: Terminal,
    title: 'Quản lý Bộ quy tắc An toàn & Prompt Playground',
    description:
      'Chủ động cập nhật danh mục rủi ro (Chặn / Gắn cờ / Viết lại) và thử nghiệm phiên bản System Prompt mới ngay trên máy chủ Edge Function.',
    tips: [
      'Lưu từng phiên bản System Prompt có đánh số thứ tự, kích hoạt 1 chạm an toàn.',
      'Khóa GEMINI_API_KEY được bảo mật 100% trong Supabase Secrets ở phía máy chủ.',
      'Thử nghiệm trực tiếp đầu ra JSON và đo độ trễ/token trong Prompt Playground.',
    ],
  },
  {
    shortLabel: 'Người dùng & Audit',
    badge: 'Quản trị 4 • Phân quyền & Truy vết',
    emoji: '🔐',
    accentBg: 'bg-butter/60',
    icon: Lock,
    title: 'Quản trị Tài khoản, Hạn mức & Nhật ký Audit',
    description:
      'Kiểm soát hạn mức tạo truyện hằng ngày của từng gia đình, tạm khóa tài khoản bất thường và tra cứu lịch sử thao tác quản trị minh bạch.',
    tips: [
      'Điều chỉnh ngưỡng tự động duyệt (Risk Score) và bật/tắt kiểm tra nét vẽ nghiêm ngặt.',
      'Cập nhật hạn mức truyện/ngày toàn hệ thống hoặc riêng từng phụ huynh.',
      'Mở lại hướng dẫn này bất cứ lúc nào từ mục "Hướng dẫn sử dụng" phía trên nút Đăng xuất.',
    ],
  },
];

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  role = 'user',
  userId,
}) => {
  const slides = role === 'admin' ? ADMIN_SLIDES : PARENT_SLIDES;
  const trackRef = useRef<HTMLDivElement>(null);
  const pendingTargetRef = useRef<number | null>(null);
  const settledSlideRef = useRef<number>(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [isNeverShowChecked, setIsNeverShowChecked] = useState(false);

  // Sync initial state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(0);
    settledSlideRef.current = 0;
    pendingTargetRef.current = null;
    setLiveAnnouncement('');
    if (typeof window !== 'undefined' && userId) {
      setIsNeverShowChecked(
        window.localStorage.getItem(getGuideNeverShowKey(userId)) === 'true'
      );
      markUserGuideSeenForSession(userId);
    }
    requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
      }
    });
  }, [isOpen, userId, role]);

  const computeNearestSlideIndex = useCallback((): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const children = Array.from(track.children) as HTMLElement[];
    if (children.length === 0) return 0;

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closestIdx = 0;
    let minDistance = Number.POSITIVE_INFINITY;

    children.forEach((child, idx) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(childCenter - trackCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    return closestIdx;
  }, []);

  const scrollToSlide = useCallback(
    (targetIdx: number) => {
      const track = trackRef.current;
      if (!track) return;
      const count = slides.length;
      const wrappedIdx = ((targetIdx % count) + count) % count;
      const slideEl = track.children[wrappedIdx] as HTMLElement | undefined;
      if (!slideEl) return;

      pendingTargetRef.current = wrappedIdx;
      setActiveIndex(wrappedIdx);

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const offsetFromCenter =
        slideEl.offsetLeft +
        slideEl.offsetWidth / 2 -
        (track.scrollLeft + track.clientWidth / 2);

      track.scrollBy({
        left: offsetFromCenter,
        behavior: prefersReduced ? 'auto' : 'smooth',
      });
    },
    [slides.length]
  );

  // Attach native scroll (rAF-throttled) + settled scrollend/debounced handler per modern carousel best practices
  useEffect(() => {
    if (!isOpen) return;
    const track = trackRef.current;
    if (!track) return;

    let rafId: number | null = null;
    let debounceTimer: number | null = null;
    const supportsScrollEnd = 'onscrollend' in window;

    const handleSettled = () => {
      pendingTargetRef.current = null;
      const idx = computeNearestSlideIndex();
      setActiveIndex(idx);
      if (idx !== settledSlideRef.current) {
        settledSlideRef.current = idx;
        setLiveAnnouncement(
          `Bước ${idx + 1} trên ${slides.length}: ${slides[idx]?.shortLabel || ''}`
        );
      }
    };

    const handleScroll = () => {
      if (pendingTargetRef.current === null && rafId === null) {
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          const nearest = computeNearestSlideIndex();
          setActiveIndex((prev) => (prev === nearest ? prev : nearest));
        });
      }

      if (!supportsScrollEnd) {
        if (debounceTimer !== null) {
          window.clearTimeout(debounceTimer);
        }
        debounceTimer = window.setTimeout(handleSettled, 140);
      }
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    if (supportsScrollEnd) {
      track.addEventListener('scrollend', handleSettled);
    }

    return () => {
      track.removeEventListener('scroll', handleScroll);
      if (supportsScrollEnd) {
        track.removeEventListener('scrollend', handleSettled);
      }
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (debounceTimer !== null) window.clearTimeout(debounceTimer);
    };
  }, [isOpen, computeNearestSlideIndex, slides]);

  const handleTemporaryClose = () => {
    markUserGuideSeenForSession(userId);
    onClose();
  };

  const handleDismissForever = () => {
    if (typeof window !== 'undefined' && userId) {
      window.localStorage.setItem(getGuideNeverShowKey(userId), 'true');
      markUserGuideSeenForSession(userId);
    }
    setIsNeverShowChecked(true);
    toast.success(
      'Đã tắt tự động hiện hướng dẫn. Bạn luôn có thể xem lại ở menu tài khoản (trên nút Đăng xuất)!'
    );
    onClose();
  };

  const handleReEnableAutoShow = () => {
    if (typeof window !== 'undefined' && userId) {
      window.localStorage.removeItem(getGuideNeverShowKey(userId));
    }
    setIsNeverShowChecked(false);
    toast.success('Đã bật lại hiển thị hướng dẫn khi đăng nhập.');
  };

  const handleNextOrFinish = () => {
    const baseIdx = pendingTargetRef.current ?? activeIndex;
    if (baseIdx < slides.length - 1) {
      scrollToSlide(baseIdx + 1);
    } else {
      handleTemporaryClose();
    }
  };

  const handlePrev = () => {
    const baseIdx = pendingTargetRef.current ?? activeIndex;
    scrollToSlide(baseIdx - 1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleTemporaryClose}
      title={
        role === 'admin'
          ? 'Hướng dẫn Quản trị viên DrawToStory'
          : 'Hướng dẫn sử dụng DrawToStory'
      }
      description="Lướt ngang trên màn hình hoặc bấm nút chuyển trang để khám phá nhanh các tính năng."
      maxWidth="2xl"
      showCloseButton={true}
    >
      <section
        aria-roledescription="carousel"
        aria-label="Hướng dẫn sử dụng từng bước"
        className="space-y-5"
      >
        {/* Top Controls + Step Indicators (Placed before track in DOM order) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              style={{ touchAction: 'manipulation' }}
              className="w-9 h-9 rounded-full bg-surface-2 hover:bg-brand-100 text-ink hover:text-brand-700 border border-ink/10 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Bước hướng dẫn trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSlide((pendingTargetRef.current ?? activeIndex) + 1)}
              style={{ touchAction: 'manipulation' }}
              className="w-9 h-9 rounded-full bg-surface-2 hover:bg-brand-100 text-ink hover:text-brand-700 border border-ink/10 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Bước hướng dẫn tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <nav
            aria-label="Chọn bước hướng dẫn"
            className="flex items-center gap-2 flex-wrap justify-center"
          >
            {slides.map((s, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={s.shortLabel}
                  type="button"
                  onClick={() => scrollToSlide(idx)}
                  aria-current={isCurrent ? 'true' : undefined}
                  aria-label={`Đến bước ${idx + 1}: ${s.shortLabel}`}
                  style={{ touchAction: 'manipulation' }}
                  className={cn(
                    'h-2.5 rounded-full transition-all duration-200 cursor-pointer',
                    isCurrent
                      ? 'w-8 bg-brand-600'
                      : 'w-2.5 bg-ink/20 hover:bg-ink/40'
                  )}
                />
              );
            })}
          </nav>

          <span className="text-xs font-heading font-bold text-ink-soft shrink-0">
            {activeIndex + 1} / {slides.length}
          </span>
        </div>

        {/* Native Horizontal Scroll-Snap Swipeable Track */}
        <div
          ref={trackRef}
          tabIndex={0}
          role="group"
          aria-label="Danh sách trang hướng dẫn (lướt ngang để xem)"
          className="guide-carousel-track rounded-3xl"
        >
          {slides.map((slide, idx) => {
            const Icon = slide.icon;
            return (
              <div
                key={slide.shortLabel}
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} trên ${slides.length}: ${slide.shortLabel}`}
                className="bg-surface-2/80 border border-ink/10 rounded-3xl p-5 sm:p-6 select-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <div
                    className={cn(
                      'w-16 h-16 rounded-2xl border border-ink/10 flex items-center justify-center text-3xl shrink-0 shadow-xs',
                      slide.accentBg
                    )}
                  >
                    <span role="img" aria-hidden="true">
                      {slide.emoji}
                    </span>
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Badge variant="primary" size="sm">
                      <Icon className="w-3.5 h-3.5 mr-1 inline-block" />
                      {slide.badge}
                    </Badge>
                    <h3 className="text-lg sm:text-xl font-heading font-extrabold text-ink leading-snug">
                      {slide.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-ink-soft leading-relaxed mb-4">
                  {slide.description}
                </p>

                <ul className="space-y-2.5 bg-surface rounded-2xl p-4 border border-ink/8">
                  {slide.tips.map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-ink leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-success-bg text-success flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        ✓
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Visually Hidden Polite Live Region for Screen Readers */}
        <p className="sr-only" role="status" aria-live="polite">
          {liveAnnouncement}
        </p>

        {/* Footer Actions: "Tắt & Không hiện lại" + Navigation */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-ink/10">
          {isNeverShowChecked ? (
            <button
              type="button"
              onClick={handleReEnableAutoShow}
              className="inline-flex items-center justify-center sm:justify-start gap-2 text-xs font-heading font-bold text-brand-600 hover:text-brand-700 px-3 py-2.5 rounded-xl hover:bg-brand-100/60 transition-colors min-h-[44px] cursor-pointer"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>Bật lại tự hiện khi đăng nhập</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDismissForever}
              className="inline-flex items-center justify-center sm:justify-start gap-2 text-xs font-heading font-bold text-ink-soft hover:text-ink px-3 py-2.5 rounded-xl hover:bg-surface-2 transition-colors min-h-[44px] cursor-pointer"
            >
              <EyeOff className="w-4 h-4 shrink-0" />
              <span>Tắt & Không hiện lại</span>
            </button>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="sm" onClick={handleTemporaryClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleNextOrFinish}
              rightIcon={
                activeIndex === slides.length - 1 ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )
              }
            >
              {activeIndex === slides.length - 1 ? 'Bắt đầu trải nghiệm' : 'Tiếp theo'}
            </Button>
          </div>
        </div>
      </section>
    </Modal>
  );
};
