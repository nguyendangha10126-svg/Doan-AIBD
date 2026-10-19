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
  Cpu
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrencyUSD } from '@/lib/utils';

export const AdminOverviewPage: React.FC = () => {
  const { kpis, chartData } = useAdminStore();

  const rejectionCategories = [
    { name: 'Khuôn mặt thật', count: 18, color: '#FF8FA3' },
    { name: 'Ảnh đời thực', count: 14, color: '#7C6CF0' },
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
            <Badge variant="accent" size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Live AI Metrics
            </Badge>
            <span className="text-xs text-main-muted font-bold">Cập nhật theo thời gian thực</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-main mt-1">
            {vi.admin.tabs.overview}
          </h1>
          <p className="text-xs sm:text-sm text-main-muted">
            {vi.admin.subtitle}
          </p>
        </div>
      </div>

      {/* 5 Real-Time KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Truyện hôm nay */}
        <Card variant="white" className="p-4 sm:p-5 border-2 border-peach/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-main-muted">
            <span className="text-xs font-heading font-bold">{vi.admin.kpi.storiesToday}</span>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-main">
              {kpis.storiesToday}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
              +14% so với hôm qua
            </span>
          </div>
        </Card>

        {/* KPI 2: Tỷ lệ bị chặn */}
        <Card variant="white" className="p-4 sm:p-5 border-2 border-peach/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-main-muted">
            <span className="text-xs font-heading font-bold">{vi.admin.kpi.blockedRate}</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-main">
              {kpis.blockedRatePercent}%
            </span>
            <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
              Phòng thủ 3 lớp ổn định
            </span>
          </div>
        </Card>

        {/* KPI 3: Hàng chờ duyệt */}
        <Card variant="white" className="p-4 sm:p-5 border-2 border-peach/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-main-muted">
            <span className="text-xs font-heading font-bold">{vi.admin.kpi.pendingQueue}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-amber-600">
              {kpis.pendingQueueCount}
            </span>
            <span className="text-[11px] text-main-muted font-bold block mt-0.5">
              Cần Admin xem xét
            </span>
          </div>
        </Card>

        {/* KPI 4: Chi phí tháng */}
        <Card variant="white" className="p-4 sm:p-5 border-2 border-peach/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-main-muted">
            <span className="text-xs font-heading font-bold">{vi.admin.kpi.monthlyCost}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-main">
              {formatCurrencyUSD(kpis.monthlyCostUsd)}
            </span>
            <span className="text-[11px] text-main-muted font-bold block mt-0.5">
              Ngân sách: {formatCurrencyUSD(kpis.monthlyBudgetUsd)}
            </span>
          </div>
        </Card>

        {/* KPI 5: Độ khớp AI-Admin */}
        <Card variant="white" className="p-4 sm:p-5 border-2 border-peach/40 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-main-muted">
            <span className="text-xs font-heading font-bold">{vi.admin.kpi.agreementRate}</span>
            <CheckCircle2 className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-accent">
              {kpis.aiAdminAgreementPercent}%
            </span>
            <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
              Độ chính xác cao
            </span>
          </div>
        </Card>
      </div>

      {/* Chart Row 1: Truyện theo ngày & Chi phí Token */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Stories Volume Trend (30 Days) */}
        <Card variant="white" className="p-5 md:p-6 space-y-4 border-2 border-peach/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-heading font-bold text-base text-main">
                Số lượng truyện sinh theo ngày (30 ngày qua)
              </h2>
            </div>
            <Badge variant="mint" size="sm">Đã duyệt vs Từ chối</Badge>
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
                    <stop offset="5%" stopColor="#FF8FA3" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FF8FA3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFF1B8" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9284A1' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9284A1' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '1rem', border: '1px solid #FFD6BA', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="approved" name="Đã duyệt" stroke="#10b981" fillOpacity={1} fill="url(#colorApproved)" />
                <Area type="monotone" dataKey="rejected" name="Bị chặn/Từ chối" stroke="#f43f5e" fillOpacity={1} fill="url(#colorRejected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Daily Cost & Latency */}
        <Card variant="white" className="p-5 md:p-6 space-y-4 border-2 border-peach/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent" />
              <h2 className="font-heading font-bold text-base text-main">
                Chi phí AI ($) & Độ trễ trung bình (ms)
              </h2>
            </div>
            <Badge variant="sky" size="sm">Gemini 2.5 Flash</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3D9FF" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9284A1' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9284A1' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9284A1' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '1rem', border: '1px solid #E3D9FF', fontSize: '12px' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="cost" name="Chi phí ($)" stroke="#7C6CF0" strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="avgLatency" name="Độ trễ (ms)" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Chart Row 2: Top Rejection Reasons & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Top Rejection Reasons BarChart */}
        <Card variant="white" className="p-5 md:p-6 space-y-4 border-2 border-peach/40">
          <h2 className="font-heading font-bold text-base text-main">
            Top nguyên nhân tranh vẽ bị từ chối / gắn cờ
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rejectionCategories} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFF9F0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#4A3F55' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem' }} />
                <Bar dataKey="count" name="Số lần chặn" fill="#FF8FA3" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Architecture Note Card */}
        <Card variant="mint" className="p-5 md:p-6 space-y-3 border-2 border-mint-dark flex flex-col justify-between">
          <div>
            <h2 className="font-heading font-black text-base text-emerald-950 flex items-center gap-2">
              <span>🛡️</span> Cơ chế Responsible AI Đảm Bảo An Toàn Tuyệt Đối
            </h2>
            <p className="text-xs text-emerald-900 mt-2 leading-relaxed">
              Hệ thống kết hợp kiểm tra tự động 3 lớp với sự giám sát trực tiếp của Ban Kiểm duyệt (Human-in-the-loop). 
              Mọi trường hợp có điểm rủi ro vượt ngưỡng &gt; 25 đều được đưa vào Hàng chờ để Admin thẩm định trước khi câu chuyện được gửi đến cho trẻ.
            </p>
          </div>

          <div className="pt-3 border-t border-mint text-xs text-emerald-800 font-bold flex items-center justify-between">
            <span>Tự động duyệt nếu rủi ro &le; 25</span>
            <span>Hàng chờ kích hoạt nếu vượt ngưỡng</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

