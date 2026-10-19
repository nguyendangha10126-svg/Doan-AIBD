import React from 'react';
import { ShieldCheck, HeartHandshake, Eye, Sparkles } from 'lucide-react';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const TrustPage: React.FC = () => {
  const principles = [
    {
      title: vi.trust.card1Title,
      desc: vi.trust.card1Desc,
      icon: HeartHandshake,
      variant: 'mint' as const,
      tag: 'Bảo vệ quyền riêng tư',
    },
    {
      title: vi.trust.card2Title,
      desc: vi.trust.card2Desc,
      icon: ShieldCheck,
      variant: 'sky' as const,
      tag: 'Phòng thủ 3 lớp',
    },
    {
      title: vi.trust.card3Title,
      desc: vi.trust.card3Desc,
      icon: Eye,
      variant: 'lavender' as const,
      tag: 'Human-in-the-Loop',
    },
    {
      title: vi.trust.card4Title,
      desc: vi.trust.card4Desc,
      icon: Sparkles,
      variant: 'peach' as const,
      tag: 'Minh bạch 100%',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <Badge variant="mint" size="md">
          🛡️ Responsible AI Framework
        </Badge>
        <h1 className="text-3xl md:text-4xl font-heading font-black text-main">
          {vi.trust.title}
        </h1>
        <p className="text-base text-main-muted max-w-2xl mx-auto leading-relaxed">
          {vi.trust.subtitle}
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {principles.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} variant={item.variant} className="p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/80 shadow-soft flex items-center justify-center text-main">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <Badge variant="neutral" size="sm">
                  {item.tag}
                </Badge>
              </div>

              <h2 className="text-xl font-heading font-bold text-main">
                {item.title}
              </h2>
              <p className="text-sm text-main-muted leading-relaxed">
                {item.desc}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Safety Workflow Diagram Card */}
      <Card variant="white" className="p-6 md:p-8 border-2 border-peach/50 space-y-4">
        <h2 className="text-xl font-heading font-bold text-main flex items-center gap-2">
          <span>⚙️</span> Quy trình Kiểm duyệt 3 Lớp Tự Động
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-cream-200 border border-peach/40">
            <span className="text-2xl block mb-2">🔍</span>
            <h3 className="font-heading font-bold text-sm text-main">Lớp 1: Input Check</h3>
            <p className="text-xs text-main-muted mt-1">
              Phát hiện khuôn mặt thật, thông tin cá nhân PII và xác thực nét vẽ trẻ em.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cream-200 border border-peach/40">
            <span className="text-2xl block mb-2">📖</span>
            <h3 className="font-heading font-bold text-sm text-main">Lớp 2: Sáng tác Sư phạm</h3>
            <p className="text-xs text-main-muted mt-1">
              Điều chỉnh từ vựng theo độ tuổi, kết thúc lạc quan và bài học đạo đức tích cực.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cream-200 border border-peach/40">
            <span className="text-2xl block mb-2">⚖️</span>
            <h3 className="font-heading font-bold text-sm text-main">Lớp 3: Safety Judge</h3>
            <p className="text-xs text-main-muted mt-1">
              Chấm điểm rủi ro (0-100). Đưa truyện rủi ro vào hàng chờ để Admin duyệt trực tiếp.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

