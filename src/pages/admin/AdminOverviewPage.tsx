import React from 'react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BookOpen, 
  ShieldAlert, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Sparkles,
  TrendingUp,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrencyUSD } from '@/lib/utils';

export const AdminOverviewPage: React.FC = () => {
  const { kpis, chartData } = useAdminStore();

  const rejectionCategories = [
    { name: 'Khuôn mặt thật', count: 18, color: '#F0607F' },
    { name: 'Ảnh đời thực/Logo', count: 14, color: '#6C5CE7' },
    { name: 'Thông tin cá nhân', count: 9, color: '#FFD6BA' },
    { name: 'Quái vật rùng rợn', count: 6, color: '#C9F0DD' },
    { name: 'Bạo lực, vũ khí', count: 3, color: '#FFF1B8' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="magic" size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Live AI Metrics
            </Badge>
            <span className="text-xs text-ink-soft font-bold">Cập nhật theo thời gian thực</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink mt-1">
            {vi.admin.tabs.overview}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            {vi.admin.subtitle}
          </p>
        </div>
      </div>

      {/* 5 Real-Time KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Truyện hôm nay */}
        <Card variant="white" className="p-4 sm:p-5 border border-ink/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">{vi.admin.kpi.storiesToday}</span>
            <BookOpen className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
              {kpis.storiesToday}
            </span>
            <span className="text-[11px] text-success font-bold block mt-0.5">
              +14% so với hôm qua
            </span>
          </div>
        </Card>

        {/* KPI 2: Tỷ lệ bị chặn */}
        <Card variant="white" className="p-4 sm:p-5 border border-ink/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">{vi.admin.kpi.blockedRate}</span>
            <ShieldAlert className="w-4 h-4 text-danger" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
              {kpis.blockedRatePercent}%
            </span>
            <span className="text-[11px] text-success font-bold block mt-0.5">
              Phòng thủ 3 lớp ổn định
            </span>
          </div>
        </Card>

        {/* KPI 3: Hàng chờ duyệt */}
        <Card variant="white" className="p-4 sm:p-5 border border-ink/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">{vi.admin.kpi.pendingQueue}</span>
            <Clock className="w-4 h-4 text-warning-text" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-warning-text">
              {kpis.pendingQueueCount}
            </span>
            <span className="text-[11px] text-ink-soft font-bold block mt-0.5">
              Cần Admin xem xét
            </span>
          </div>
        </Card>

        {/* KPI 4: Chi phí tháng */}
        <Card variant="white" className="p-4 sm:p-5 border border-ink/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">{vi.admin.kpi.monthlyCost}</span>
            <DollarSign className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
              {formatCurrencyUSD(kpis.monthlyCostUsd)}
            </span>
            <span className="text-[11px] text-ink-soft font-bold block mt-0.5">
              Ngân sách: {formatCurrencyUSD(kpis.monthlyBudgetUsd)}
            </span>
          </div>
        </Card>

        {/* KPI 5: Độ khớp AI-Admin */}
        <Card variant="white" className="p-4 sm:p-5 border border-ink/10 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">{vi.admin.kpi.agreementRate}</span>
            <CheckCircle2 className="w-4 h-4 text-magic-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-magic-600">
              {kpis.aiAdminAgreementPercent}%
            </span>
            <span className="text-[11px] text-success font-bold block mt-0.5">
              Độ chính xác cao
            </span>
          </div>
        </Card>
      </div>

      {/* Chart Row 1: Truyện theo ngày & Chi phí Token */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Stories Volume Trend (30 Days) */}
        <Card variant="white" className="p-5 md:p-6 space-y-4 border border-ink/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <h2 className="font-heading font-extrabold text-base text-ink">
                Số lượng truyện sinh theo ngày (30 ngày qua)
              </h2>
            </div>
            <Badge variant="mint" size="sm">Đã duyệt vs Bị chặn</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9F0DD" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#C9F0DD" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFE3EA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFE3EA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFF3E6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#5E5370' }} />
                <YAxis tick={{ fontSize: 10, fill: '#5E5370' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '1rem', border: '1px solid #FFE3EA', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="approved" name="Đã duyệt" stroke="#166E48" fillOpacity={1} fill="url(#colorApproved)" />
                <Area type="monotone" dataKey="rejected" name="Bị chặn/Từ chối" stroke="#D13A5E" fillOpacity={1} fill="url(#colorRejected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Daily Cost & Latency */}
        <Card variant="white" className="p-5 md:p-6 space-y-4 border border-ink/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-magic-600" />
              <h2 className="font-heading font-extrabold text-base text-ink">
                Chi phí AI ($) & Độ trễ trung bình (ms)
              </h2>
            </div>
            <Badge variant="sky" size="sm">Gemini 2.5 Flash</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFF3E6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#5E5370' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#5E5370' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#5E5370' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '1rem', border: '1px solid #FFF3E6', fontSize: '12px' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="cost" name="Chi phí ($)" stroke="#6C5CE7" strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="avgLatency" name="Độ trễ (ms)" stroke="#8A5A00" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Chart Row 2: Top Rejection Reasons & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Top Rejection Reasons BarChart */}
        <Card variant="white" className="p-5 md:p-6 space-y-4 border border-ink/10">
          <h2 className="font-heading font-extrabold text-base text-ink">
            Top nguyên nhân tranh vẽ bị từ chối / gắn cờ
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rejectionCategories} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFF9F0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#2E2540' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem' }} />
                <Bar dataKey="count" name="Số lần chặn" fill="#F0607F" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Responsible AI Overview Card */}
        <Card variant="white" className="p-5 md:p-6 space-y-3 border border-ink/10 bg-mint/15 flex flex-col justify-between">
          <div>
            <h2 className="font-heading font-extrabold text-base text-ink flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success-text" /> Cơ chế Responsible AI Đảm Bảo An Toàn Tuyệt Đối
            </h2>
            <p className="text-xs text-ink-soft mt-2 leading-relaxed">
              Hệ thống kết hợp kiểm tra tự động 3 lớp (Layer 1: Phân loại tranh vẽ nghiêm ngặt; Layer 2: Đối chiếu vật thể tranh; Layer 3: Chấm điểm trung thực & rủi ro) với sự giám sát trực tiếp của Ban Kiểm duyệt (Human-in-the-loop). 
              Mọi trường hợp có điểm rủi ro vượt ngưỡng &gt; 25 đều được đưa vào Hàng chờ để Admin thẩm định trước khi câu chuyện được gửi đến cho trẻ.
            </p>
          </div>

          <div className="pt-3 border-t border-ink/10 text-xs text-ink font-bold flex items-center justify-between">
            <span className="text-success-text">Tự động duyệt nếu rủi ro &le; 25</span>
            <span className="text-brand-600">Hàng chờ kích hoạt nếu vượt ngưỡng</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
