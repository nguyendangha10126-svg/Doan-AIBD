import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, Server, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const ModerationSettingsPage: React.FC = () => {
  const {
    moderationMode,
    autoApproveMaxRisk,
    strictDrawingCheck,
    updateModerationSettings,
    setStrictDrawingCheck,
  } = useAdminStore();

  const [mode, setMode] = useState(moderationMode);
  const [maxRisk, setMaxRisk] = useState(autoApproveMaxRisk);
  const [strictDrawing, setStrictDrawing] = useState(strictDrawingCheck);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  useEffect(() => {
    setMode(moderationMode);
    setMaxRisk(autoApproveMaxRisk);
    setStrictDrawing(strictDrawingCheck);
  }, [moderationMode, autoApproveMaxRisk, strictDrawingCheck]);

  const handleSavePolicy = async () => {
    setIsSavingPolicy(true);
    const [okMod, okStrict] = await Promise.all([
      updateModerationSettings(mode, maxRisk),
      setStrictDrawingCheck(strictDrawing),
    ]);
    setIsSavingPolicy(false);

    if (okMod && okStrict) {
      toast.success('Đã lưu cấu hình kiểm duyệt toàn hệ thống vào cơ sở dữ liệu!');
    } else {
      toast.error('Không thể lưu cấu hình. Vui lòng kiểm tra kết nối và quyền Quản trị viên.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
          {vi.admin.settingsView.title}
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1">
          Quản trị kiến trúc khóa AI phía máy chủ, bộ lọc tranh vẽ nghiêm ngặt và ngưỡng rủi ro tự động duyệt
        </p>
      </div>

      {/* 1. Server-Side AI Secret Architecture Card (Zero Client Key Exposure) */}
      <Card variant="white" className="p-6 md:p-8 border border-ink/10 space-y-4 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mint flex items-center justify-center text-success shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-base text-ink flex items-center gap-2">
                <span>Máy chủ AI Bảo mật (Supabase Edge Functions)</span>
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Khóa GEMINI_API_KEY được cô lập 100% trên máy chủ, không bao giờ tải xuống trình duyệt
              </p>
            </div>
          </div>

          <Badge variant="success" size="sm">
            <Lock className="w-3.5 h-3.5 mr-1" />
            Bảo mật Server-Side
          </Badge>
        </div>

        <div className="p-4 rounded-2xl bg-surface-2 border border-ink/10 space-y-2 text-xs text-ink leading-relaxed">
          <p className="font-semibold">
            Hướng dẫn cập nhật hoặc xoay vòng khóa Gemini API Key trên Supabase:
          </p>
          <pre className="p-3 rounded-xl bg-ink text-white font-mono text-[11px] overflow-x-auto">
            supabase secrets set GEMINI_API_KEY=AIzaSy... GEMINI_MODEL=gemini-2.5-flash
          </pre>
          <p className="text-ink-soft">
            Mọi yêu cầu tạo truyện (<code className="font-mono text-ink">generate-story</code>) và thử nghiệm Prompt (<code className="font-mono text-ink">admin-test-prompt</code>) đều xác thực JWT trước khi gọi Gemini từ máy chủ.
          </p>
        </div>
      </Card>

      {/* 2. Moderation Policy & Strict Drawing Check Card */}
      <Card variant="white" className="p-6 md:p-8 border border-ink/10 space-y-8 shadow-card">
        {/* Strict Drawing Check Toggle */}
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
                Bật tính năng này để từ chối các ảnh không phải tranh vẽ trẻ em (ảnh chụp khuôn mặt người thật, logo thương mại, ảnh chụp màn hình văn bản). Khi tắt, hệ thống vẫn chặn khuôn mặt thật và PII nhưng cho phép thêm tranh minh họa kỹ thuật số.
              </p>
            </div>

            <button
              type="button"
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

          <div className="p-3 bg-surface-2 rounded-2xl border border-ink/10 text-xs text-ink-soft flex flex-wrap items-center justify-between gap-2">
            <span>Trạng thái hiện tại:</span>
            <span className={`font-bold ${strictDrawing ? 'text-success-text' : 'text-warning-text'}`}>
              {strictDrawing
                ? '✓ Đang bật (Nghiêm ngặt - Chỉ chấp nhận tranh vẽ trẻ em)'
                : '⚠ Đang tắt (Chế độ linh hoạt)'}
            </span>
          </div>
        </div>

        {/* Moderation Mode Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-heading font-extrabold text-ink">
            {vi.admin.settingsView.modeLabel}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {vi.admin.settingsView.modeAuto}. Nếu điểm rủi ro &le; ngưỡng và điểm bám tranh &ge; 60, truyện sẽ sẵn sàng ngay cho bé đọc.
              </p>
            </div>

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
                {vi.admin.settingsView.modeManual}. Tất cả câu chuyện đều chuyển vào Hàng chờ để Admin xét duyệt trước khi mở đọc.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Threshold Slider */}
        <div className="space-y-4 pt-4 border-t border-ink/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="block text-sm font-heading font-extrabold text-ink">
                {vi.admin.settingsView.maxRiskLabel}
              </label>
              <p className="text-xs text-ink-soft mt-0.5">
                {vi.admin.settingsView.maxRiskDesc}
              </p>
            </div>
            <span className="text-2xl font-heading font-extrabold text-brand-600 px-3 py-1 bg-brand-100 rounded-xl shrink-0">
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
            <span className="text-brand-600 font-bold">25 (Khuyến nghị)</span>
            <span className="text-warning-text">60 (Thoáng hơn)</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end border-t border-ink/10">
          <Button
            variant="primary"
            size="lg"
            isLoading={isSavingPolicy}
            onClick={handleSavePolicy}
            rightIcon={<Check className="w-4 h-4" />}
          >
            {vi.admin.settingsView.saveSettings}
          </Button>
        </div>
      </Card>
    </div>
  );
};
