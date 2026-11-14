import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Scan,
  BookOpenCheck,
  Scale,
  Lock,
  HeartHandshake,
} from 'lucide-react';
import { useStoryStore } from '@/store/storyStore';
import { isUsingDemoSession } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { isStoryApproved } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const TrustPage: React.FC = () => {
  const { stories } = useStoryStore();

  const [stats, setStats] = useState<{
    approvalRateText: string;
    avgReviewTimeText: string;
    blockedCount: number;
    totalStories: number;
  }>({
    approvalRateText: '—',
    avgReviewTimeText: '—',
    blockedCount: 0,
    totalStories: 0,
  });

  useEffect(() => {
    async function loadRealStats() {
      if (!isUsingDemoSession()) {
        try {
          const [
            { count: totalCount },
            { count: approvedCount },
            { count: rejectedCount },
            { data: latencyLogs },
          ] = await Promise.all([
            supabase.from('stories').select('*', { count: 'exact', head: true }),
            supabase
              .from('stories')
              .select('*', { count: 'exact', head: true })
              .in('status', ['auto_approved', 'approved', 'parent_approved']),
            supabase
              .from('stories')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'rejected'),
            supabase
              .from('ai_logs')
              .select('latency_ms, action, status')
              .limit(100),
          ]);

          const total = totalCount ?? stories.length;
          const approved =
            approvedCount ?? stories.filter((s) => isStoryApproved(s.status)).length;
          const rejected =
            rejectedCount ?? stories.filter((s) => s.status === 'rejected').length;

          const validLatencies = (latencyLogs || [])
            .map((l) => Number((l as { latency_ms?: number }).latency_ms) || 0)
            .filter((ms) => ms > 0);

          const inputBlocked = (latencyLogs || []).filter(
            (l) => (l as { action?: string }).action === 'layer1_input_safety_blocked'
          ).length;

          const avgLatencyText =
            validLatencies.length > 0
              ? `${(
                  validLatencies.reduce((acc, ms) => acc + ms, 0) /
                  validLatencies.length /
                  1000
                ).toFixed(1)}s`
              : 'Chưa có dữ liệu';

          setStats({
            approvalRateText: total > 0 ? `${Math.round((approved / total) * 100)}%` : 'Chưa có dữ liệu',
            avgReviewTimeText: avgLatencyText,
            blockedCount: rejected + inputBlocked,
            totalStories: total,
          });
        } catch {
          computeFromStore();
        }
      } else {
        computeFromStore();
      }
    }

    function computeFromStore() {
      const total = stories.length;
      const approved = stories.filter((s) => isStoryApproved(s.status)).length;
      const rejected = stories.filter((s) => s.status === 'rejected').length;

      setStats({
        approvalRateText: total > 0 ? `${Math.round((approved / total) * 100)}%` : 'Chưa có dữ liệu',
        avgReviewTimeText: 'Chưa có dữ liệu',
        blockedCount: rejected,
        totalStories: total,
      });
    }

    loadRealStats();
  }, [stories]);

  const layers = [
    {
      step: 'Lớp 1',
      title: 'Multimodal Input & Drawing Verification',
      subtitle: 'Xác thực nét vẽ trẻ thơ & Bảo mật dữ liệu đầu vào',
      icon: Scan,
      badge: 'Bảo vệ Đầu Vào',
      variant: 'mint' as const,
      description:
        'Hệ thống phân tích thị giác trên máy chủ xác định ảnh có phải tranh vẽ tay của bé hay không. Đồng thời phát hiện và từ chối ảnh chứa khuôn mặt người thật ngoài đời, thông tin cá nhân (PII như số điện thoại, địa chỉ nhà) hoặc ảnh logo thương mại.',
      example:
        'Ví dụ: Ảnh chụp màn hình tài liệu hay ảnh logo công ty sẽ bị từ chối và xóa ngay khỏi kho lưu trữ tạm với thông điệp thân thiện: "Mình chưa thấy nét vẽ của bé, thử chụp lại tranh trên giấy nhé".',
    },
    {
      step: 'Lớp 2',
      title: 'Grounded Creative Storytelling',
      subtitle: 'Sáng tác sư phạm bám sát từng chi tiết tranh vẽ',
      icon: BookOpenCheck,
      badge: 'Chống Bịa Đặt AI',
      variant: 'sky' as const,
      description:
        'Toàn bộ danh sách đồ vật (objects), nhân vật (characters), màu sắc và cảm xúc nhận diện từ tranh vẽ được truyền trực tiếp vào mô hình như "sự thật bắt buộc". Cốt truyện 4–5 trang phải dẫn dắt từ nét vẽ của con, từ ngữ được tinh chỉnh chuẩn mực theo lứa tuổi 2–12.',
      example:
        'Ví dụ: Khi bé vẽ chú voi màu hồng, AI bắt buộc dùng hình tượng chú voi tai hồng làm trọng tâm, tuyệt đối không tự ý thay thế bằng nhân vật ngoài tranh.',
    },
    {
      step: 'Lớp 3',
      title: 'Output Safety & Faithfulness Judge',
      subtitle: 'Giám định viên độc lập chấm điểm an toàn và độ bám tranh',
      icon: Scale,
      badge: 'Thẩm Định Độc Lập',
      variant: 'lavender' as const,
      description:
        'Mô hình giám định độc lập chấm điểm rủi ro (Risk Score 0–100) và độ bám sát nét vẽ (Faithfulness Score 0–100). Nếu truyện đạt điểm an toàn cao sẽ được duyệt ngay. Những câu chuyện chạm ngưỡng nghi vấn sẽ được chuyển sang hàng chờ để Quản trị viên kiểm duyệt thủ công (Human-in-the-Loop).',
      example:
        'Ví dụ: Truyện có độ bám tranh dưới 60 điểm sẽ tự động được sinh lại kèm góp ý cải thiện hoặc chuyển sang hàng chờ duyệt trước khi cho bé đọc.',
    },
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint text-ink text-xs font-heading font-extrabold border border-ink/10 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[#166E48]" />
          <span>Responsible AI Framework for Children</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight">
          Minh Bạch & An Toàn AI Cho Trẻ Thơ
        </h1>
        <p className="text-sm md:text-base text-ink-soft max-w-2xl mx-auto leading-relaxed">
          DrawToStory xây dựng môi trường sáng tạo trong sáng, bảo vệ quyền riêng tư của trẻ em theo nguyên tắc GDPR (Tối thiểu hóa dữ liệu & Quyền được xóa vĩnh viễn) và Trí tuệ Nhân tạo Có trách nhiệm.
        </p>
      </div>

      {/* Live Database Metrics Row (Zero Hardcoded Claims) */}
      <Card variant="white" className="p-6 shadow-card border border-ink/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-ink/10">
          <div className="pt-3 md:pt-0 md:px-4 first:pl-0 text-center">
            <span className="text-xl md:text-2xl font-heading font-extrabold text-ink block">
              {stats.totalStories}
            </span>
            <span className="text-xs text-ink-soft mt-1 block font-medium">
              Tổng truyện đã thẩm định
            </span>
          </div>

          <div className="pt-3 md:pt-0 md:px-4 text-center">
            <span className="text-xl md:text-2xl font-heading font-extrabold text-brand-600 block">
              {stats.approvalRateText}
            </span>
            <span className="text-xs text-ink-soft mt-1 block font-medium">
              Tỷ lệ truyện đạt chuẩn
            </span>
          </div>

          <div className="pt-3 md:pt-0 md:px-4 text-center">
            <span className="text-xl md:text-2xl font-heading font-extrabold text-ink block">
              {stats.avgReviewTimeText}
            </span>
            <span className="text-xs text-ink-soft mt-1 block font-medium">
              Thời gian xử lý AI TB
            </span>
          </div>

          <div className="pt-3 md:pt-0 md:px-4 last:pr-0 text-center">
            <span className="text-xl md:text-2xl font-heading font-extrabold text-[#166E48] block">
              {stats.blockedCount}
            </span>
            <span className="text-xs text-ink-soft mt-1 block font-medium">
              Nội dung rủi ro đã chặn
            </span>
          </div>
        </div>
      </Card>

      {/* Vertical 3-Layer Timeline */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink tracking-tight">
            Kiến Trúc Phòng Thủ 3 Lớp Chuyên Biệt
          </h2>
          <p className="text-xs text-ink-soft mt-1">
            Mọi bức tranh và câu chuyện đều trải qua quy trình xác thực tự động trên máy chủ trước khi bé có thể mở đọc.
          </p>
        </div>

        <div className="relative pl-6 sm:pl-10 space-y-8 before:content-[''] before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-ink/15">
          {layers.map((layer, idx) => {
            const Icon = layer.icon;

            return (
              <div key={layer.step} className="relative group">
                <div className="absolute -left-6 sm:-left-10 top-6 -translate-x-1/2 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-heading font-bold text-xs shadow-btn-primary z-10 border-2 border-bg">
                  {idx + 1}
                </div>

                <Card variant="white" className="p-6 md:p-8 space-y-4 border border-ink/10 shadow-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-surface-2 border border-ink/10 flex items-center justify-center text-brand-600 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-brand-600 uppercase tracking-wider">
                            {layer.step}
                          </span>
                          <span className="text-xs text-ink-faint">•</span>
                          <span className="text-xs font-heading font-bold text-ink-soft">
                            {layer.subtitle}
                          </span>
                        </div>
                        <h3 className="text-lg md:text-xl font-heading font-extrabold text-ink mt-0.5">
                          {layer.title}
                        </h3>
                      </div>
                    </div>

                    <Badge variant={layer.variant} size="sm">
                      {layer.badge}
                    </Badge>
                  </div>

                  <p className="text-sm text-ink-soft leading-relaxed">
                    {layer.description}
                  </p>

                  <div className="p-4 rounded-2xl bg-surface-2 border border-ink/10 text-xs text-ink leading-relaxed font-body">
                    <strong className="font-heading font-extrabold text-ink block mb-1">
                      Minh chứng quy trình:
                    </strong>
                    {layer.example}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Privacy & Family Ownership */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="white" className="p-6 md:p-8 space-y-3 border border-ink/10 shadow-card">
          <div className="w-10 h-10 rounded-2xl bg-mint text-[#166E48] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-heading font-extrabold text-ink">
            Quyền Kiểm Soát & Xóa Vĩnh Viễn (GDPR)
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed">
            Phụ huynh có toàn quyền xuất toàn bộ dữ liệu gia đình dạng JSON hoặc kích hoạt Xóa vĩnh viễn tài khoản để xóa sạch hồ sơ xác thực, tranh vẽ trên Storage và lịch sử truyện.
          </p>
        </Card>

        <Card variant="white" className="p-6 md:p-8 space-y-3 border border-ink/10 shadow-card">
          <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-heading font-extrabold text-ink">
            Đạo Đức & Giáo Dục Lành Mạnh
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed">
            Mỗi cốt truyện đều hướng tới lòng nhân ái, sự sẻ chia, tình cảm gia đình và khuyến khích bé tiếp tục cầm bút vẽ lên ước mơ của mình.
          </p>
        </Card>
      </div>
    </div>
  );
};
