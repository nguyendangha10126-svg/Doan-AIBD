import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const ModerationSettingsPage: React.FC = () => {
  const { moderationMode, autoApproveMaxRisk, updateModerationSettings } = useAdminStore();

  const [mode, setMode] = useState(moderationMode);
  const [maxRisk, setMaxRisk] = useState(autoApproveMaxRisk);

  const handleSave = () => {
    updateModerationSettings(mode, maxRisk);
    toast.success('Đã lưu cấu hình kiểm duyệt toàn hệ thống!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-main">
          {vi.admin.settingsView.title}
        </h1>
        <p className="text-xs sm:text-sm text-main-muted mt-1">
          Kiểm soát chính sách tự động hóa và mức độ khắt khe của bộ lọc an toàn trẻ em
        </p>
      </div>

      <Card variant="white" className="p-6 md:p-8 border-2 border-peach/50 space-y-8">
        {/* Moderation Mode Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-heading font-black text-main">
            {vi.admin.settingsView.modeLabel}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto Mode */}
            <div
              onClick={() => setMode('auto')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                mode === 'auto'
                  ? 'bg-mint-light/60 border-emerald-500 shadow-soft ring-2 ring-emerald-300/40'
                  : 'bg-cream-100 border-peach/40 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-sm text-main">
                  Tự động duyệt (Auto)
                </span>
                <span className="text-xl">⚡</span>
              </div>
              <p className="text-xs text-main-muted leading-relaxed">
                {vi.admin.settingsView.modeAuto}. Nếu điểm rủi ro &le; ngưỡng, truyện sẽ sẵn sàng ngay cho bé đọc.
              </p>
            </div>

            {/* Manual All Mode */}
            <div
              onClick={() => setMode('manual_all')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                mode === 'manual_all'
                  ? 'bg-amber-50 border-amber-500 shadow-soft ring-2 ring-amber-300/40'
                  : 'bg-cream-100 border-peach/40 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-sm text-main">
                  Duyệt thủ công (Manual All)
                </span>
                <span className="text-xl">🛡️</span>
              </div>
              <p className="text-xs text-main-muted leading-relaxed">
                {vi.admin.settingsView.modeManual}. Tất cả câu chuyện đều phải qua Admin xét duyệt trước khi phụ huynh có thể đọc.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Threshold Slider */}
        <div className="space-y-4 pt-4 border-t border-peach/30">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-heading font-black text-main">
                {vi.admin.settingsView.maxRiskLabel}
              </label>
              <p className="text-xs text-main-muted mt-0.5">
                {vi.admin.settingsView.maxRiskDesc}
              </p>
            </div>
            <span className="text-2xl font-heading font-black text-primary px-3 py-1 bg-primary-light rounded-xl">
              {maxRisk}
            </span>
          </div>

          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={maxRisk}
            onChange={(e) => setMaxRisk(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />

          <div className="flex justify-between text-[11px] font-heading font-bold text-main-muted">
            <span className="text-emerald-700">5 (Rất khắt khe)</span>
            <span className="text-primary font-bold">25 (Tiêu chuẩn đồ án)</span>
            <span className="text-amber-700">60 (Thoáng hơn)</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end border-t border-peach/30">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            rightIcon={<Check className="w-4 h-4" />}
          >
            {vi.admin.settingsView.saveSettings}
          </Button>
        </div>
      </Card>
    </div>
  );
};
