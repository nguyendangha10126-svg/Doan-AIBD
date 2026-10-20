import React, { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const ModerationSettingsPage: React.FC = () => {
  const { 
    moderationMode, 
    autoApproveMaxRisk, 
    strictDrawingCheck,
    updateModerationSettings,
    setStrictDrawingCheck 
  } = useAdminStore();

  const [mode, setMode] = useState(moderationMode);
  const [maxRisk, setMaxRisk] = useState(autoApproveMaxRisk);
  const [strictDrawing, setStrictDrawing] = useState(strictDrawingCheck);

  const handleSave = () => {
    updateModerationSettings(mode, maxRisk);
    setStrictDrawingCheck(strictDrawing);
    toast.success('Đã lưu cấu hình kiểm duyệt toàn hệ thống!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
          {vi.admin.settingsView.title}
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1">
          Kiểm soát chính sách tự động hóa, bộ lọc tranh vẽ nghiêm ngặt và mức độ khắt khe của bộ lọc an toàn trẻ em
        </p>
      </div>

      <Card variant="white" className="p-6 md:p-8 border border-ink/10 space-y-8">
        
        {/* 1. Strict Drawing Check Toggle */}
        <div className="space-y-3 pb-6 border-b border-ink/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-magic-600" />
                <h3 className="font-heading font-extrabold text-base text-ink">
                  Kiểm tra tranh vẽ nghiêm ngặt (Strict Drawing Check)
                </h3>
              </div>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed max-w-xl">
                Bật tính năng này để từ chối các ảnh không phải tranh vẽ trẻ em (ảnh chụp khuôn mặt người lớn, logo đồ họa, văn bản chụp màn hình). Khi tắt, hệ thống hoạt động ở chế độ demo cởi mở hơn.
              </p>
            </div>

            {/* Switch Toggle */}
            <button
              onClick={() => setStrictDrawing(!strictDrawing)}
              className={`w-14 h-8 rounded-full transition-colors relative shrink-0 p-1 cursor-pointer ${
                strictDrawing ? 'bg-brand-600' : 'bg-ink/20'
              }`}
              aria-label="Bật tắt kiểm tra tranh vẽ nghiêm ngặt"
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
                  strictDrawing ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-3 bg-surface-2 rounded-2xl border border-ink/10 text-xs text-ink-soft flex items-center justify-between">
            <span>Trạng thái hiện tại:</span>
            <span className={`font-bold ${strictDrawing ? 'text-success-text' : 'text-warning-text'}`}>
              {strictDrawing ? '✓ Đang bật (Nghiêm ngặt - Chống ảnh chụp & logo)' : '⚠ Đang tắt (Chế độ demo linh hoạt)'}
            </span>
          </div>
        </div>

        {/* 2. Moderation Mode Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-heading font-extrabold text-ink">
            {vi.admin.settingsView.modeLabel}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto Mode */}
            <div
              onClick={() => setMode('auto')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                mode === 'auto'
                  ? 'bg-mint/40 border-success shadow-card ring-2 ring-mint'
                  : 'bg-surface-2 border-ink/10 hover:bg-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-sm text-ink">
                  Tự động duyệt (Auto)
                </span>
                <span className="text-xl">⚡</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                {vi.admin.settingsView.modeAuto}. Nếu điểm rủi ro &le; ngưỡng, truyện sẽ sẵn sàng ngay cho bé đọc.
              </p>
            </div>

            {/* Manual All Mode */}
            <div
              onClick={() => setMode('manual_all')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                mode === 'manual_all'
                  ? 'bg-peach/40 border-brand-600 shadow-card ring-2 ring-brand-100'
                  : 'bg-surface-2 border-ink/10 hover:bg-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-sm text-ink">
                  Duyệt thủ công (Manual All)
                </span>
                <span className="text-xl">🛡️</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                {vi.admin.settingsView.modeManual}. Tất cả câu chuyện đều phải qua Admin xét duyệt trước khi phụ huynh có thể đọc.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Risk Threshold Slider */}
        <div className="space-y-4 pt-4 border-t border-ink/10">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-heading font-extrabold text-ink">
                {vi.admin.settingsView.maxRiskLabel}
              </label>
              <p className="text-xs text-ink-soft mt-0.5">
                {vi.admin.settingsView.maxRiskDesc}
              </p>
            </div>
            <span className="text-2xl font-heading font-extrabold text-brand-600 px-3 py-1 bg-brand-100 rounded-xl">
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
            className="w-full accent-brand-600 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] font-heading font-bold text-ink-soft">
            <span className="text-success-text">5 (Rất khắt khe)</span>
            <span className="text-brand-600 font-bold">25 (Tiêu chuẩn đồ án)</span>
            <span className="text-warning-text">60 (Thoáng hơn)</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end border-t border-ink/10">
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
