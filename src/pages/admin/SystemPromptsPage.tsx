import React, { useState, useEffect } from 'react';
import { Save, Check, Play, History, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { StoryGenerationService } from '@/features/ai/services/storyGenerationService';
import { vi } from '@/lib/i18n/vi';
import { formatCurrencyUSD } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';

export const SystemPromptsPage: React.FC = () => {
  const { systemPrompts, saveSystemPromptVersion, setActiveSystemPrompt } = useAdminStore();

  const activePrompt = systemPrompts.find((p) => p.is_active) || systemPrompts[0];
  const [selectedPromptId, setSelectedPromptId] = useState(activePrompt?.id || '');
  const [editorText, setEditorText] = useState(activePrompt?.prompt_text || '');
  const [newVersionName, setNewVersionName] = useState('');
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  // Sync editor when systemPrompts load from DB
  useEffect(() => {
    if (!selectedPromptId && activePrompt) {
      setSelectedPromptId(activePrompt.id);
      setEditorText(activePrompt.prompt_text);
    }
  }, [activePrompt, selectedPromptId]);

  // Playground state
  const [sampleNickname, setSampleNickname] = useState('Bé Bơ');
  const [sampleAge, setSampleAge] = useState(5);
  const [sampleDetails, setSampleDetails] = useState('Ngôi nhà mái đỏ dưới ông mặt trời mỉm cười và khóm hoa hướng dương');
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<{
    title: string;
    summary: string;
    moral: string;
    pages: Array<{ page_number: number; text_content: string; emotion?: string }>;
    metrics: {
      inputTokens: number;
      outputTokens: number;
      latencyMs: number;
      estimatedCostUsd: number;
      model: string;
    };
  } | null>(null);

  const selectedPrompt = systemPrompts.find((p) => p.id === selectedPromptId) || activePrompt;

  const handleSelectPrompt = (promptId: string) => {
    setSelectedPromptId(promptId);
    const p = systemPrompts.find((item) => item.id === promptId);
    if (p) {
      setEditorText(p.prompt_text);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!newVersionName.trim()) {
      toast.error('Vui lòng nhập tên cho phiên bản mới');
      return;
    }
    if (!editorText.trim()) {
      toast.error('Nội dung System Prompt không được để trống');
      return;
    }
    setIsSavingVersion(true);
    const ok = await saveSystemPromptVersion(newVersionName.trim(), editorText.trim());
    setIsSavingVersion(false);
    if (ok) {
      toast.success('Đã lưu phiên bản System Prompt mới vào CSDL!');
      setNewVersionName('');
    } else {
      toast.error('Không thể lưu phiên bản mới. Vui lòng thử lại.');
    }
  };

  const handleActivateVersion = async (promptId: string, versionNumber: number) => {
    const ok = await setActiveSystemPrompt(promptId);
    if (ok) {
      toast.success(`Đã kích hoạt phiên bản v${versionNumber} làm Active chính thức!`);
    } else {
      toast.error('Không thể kích hoạt phiên bản này.');
    }
  };

  const handleRunPlayground = async () => {
    if (!editorText.trim()) {
      toast.error('Vui lòng nhập nội dung System Prompt để thử nghiệm.');
      return;
    }
    setIsTesting(true);
    setTestOutput(null);

    try {
      const result = await StoryGenerationService.runPromptPlayground({
        promptText: editorText,
        sampleNickname: sampleNickname.trim() || 'Bé Yêu',
        sampleAge: Math.min(12, Math.max(2, Number(sampleAge) || 5)),
        sampleDetails: sampleDetails.trim() || 'Bức tranh thiên nhiên tươi sáng',
      });
      setTestOutput(result);
      toast.success('Đã chạy thử nghiệm Prompt thật với AI thành công!');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Không thể chạy thử nghiệm Prompt lúc này.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
          {vi.admin.prompts.title}
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1">
          {vi.admin.prompts.subtitle}
        </p>
      </div>

      {/* Editor & Version History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Version History (Left 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card variant="white" className="p-5 border border-ink/10 space-y-4 shadow-card">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-magic-600" />
              <h2 className="font-heading font-extrabold text-sm text-ink">
                {vi.admin.prompts.versionHistory}
              </h2>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {systemPrompts.map((p) => {
                const isCurrent = p.id === selectedPromptId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPrompt(p.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-lavender/35 border-magic-600 shadow-xs'
                        : 'bg-surface-2 border-ink/10 hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-bold text-xs text-ink truncate">
                        {p.name}
                      </span>
                      {p.is_active ? (
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          v{p.version}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink/10">
                      <span className="text-[11px] text-ink-soft">
                        Phiên bản v{p.version}
                      </span>
                      {!p.is_active && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateVersion(p.id, p.version);
                          }}
                          className="text-[11px] font-heading font-bold text-brand-600 hover:underline cursor-pointer"
                        >
                          {vi.admin.prompts.setActive}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Prompt Editor (Right 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card variant="white" className="p-6 md:p-8 border border-ink/10 space-y-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-heading font-bold text-ink-soft">
                  Đang chỉnh sửa:
                </span>
                <h3 className="text-lg font-heading font-extrabold text-ink">
                  {selectedPrompt?.name || 'System Prompt'}{' '}
                  {selectedPrompt?.is_active && (
                    <span className="text-xs font-bold text-success-text">(Đang chạy chính thức)</span>
                  )}
                </h3>
              </div>

              {selectedPrompt && !selectedPrompt.is_active && (
                <Button
                  variant="magic"
                  size="sm"
                  onClick={() => handleActivateVersion(selectedPrompt.id, selectedPrompt.version)}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  {vi.admin.prompts.setActive}
                </Button>
              )}
            </div>

            <Textarea
              rows={12}
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              className="font-mono text-xs leading-relaxed"
            />

            {/* Save as New Version Form */}
            <div className="p-4 rounded-2xl bg-surface-2 border border-ink/10 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full flex-1">
                <Input
                  placeholder="Tên phiên bản mới (ví dụ: v1.3 - Giọng kể giàu biểu cảm)"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                size="md"
                isLoading={isSavingVersion}
                onClick={handleSaveAsNewVersion}
                leftIcon={<Save className="w-4 h-4" />}
                className="shrink-0 w-full sm:w-auto"
              >
                {vi.admin.prompts.createNewVersion}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Real Interactive Gemini Prompt Playground */}
      <Card variant="white" className="p-6 md:p-8 border border-ink/10 space-y-6 shadow-card bg-surface-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-magic-600 animate-pulse" />
            <h2 className="text-lg md:text-xl font-heading font-extrabold text-ink">
              {vi.admin.prompts.playgroundTitle}
            </h2>
          </div>
          <Badge variant="magic" size="sm">
            Gọi Gemini 2.5 Flash trực tiếp (Không tạo sách thừa)
          </Badge>
        </div>

        {/* Playground Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Biệt danh bé thử nghiệm"
            value={sampleNickname}
            onChange={(e) => setSampleNickname(e.target.value)}
          />
          <Input
            label="Độ tuổi (2 - 12)"
            type="number"
            min={2}
            max={12}
            value={sampleAge}
            onChange={(e) => setSampleAge(Number(e.target.value))}
          />
          <Input
            label="Chi tiết bức tranh mẫu"
            value={sampleDetails}
            onChange={(e) => setSampleDetails(e.target.value)}
          />
        </div>

        <div>
          <Button
            variant="magic"
            size="md"
            isLoading={isTesting}
            onClick={handleRunPlayground}
            leftIcon={<Play className="w-4 h-4" />}
          >
            {vi.admin.prompts.testSampleImage}
          </Button>
        </div>

        {/* Playground Real Output */}
        {testOutput && (
          <div className="p-5 md:p-6 rounded-2xl bg-surface border border-ink/10 space-y-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-ink/10 pb-3">
              <span className="font-heading font-extrabold text-magic-600">
                {vi.admin.prompts.testOutput} ({testOutput.metrics.model})
              </span>
              <div className="flex flex-wrap items-center gap-3 text-ink-soft font-mono">
                <span>Tokens: {testOutput.metrics.inputTokens} in / {testOutput.metrics.outputTokens} out</span>
                <span>Latency: {testOutput.metrics.latencyMs}ms</span>
                <span>Cost: {formatCurrencyUSD(testOutput.metrics.estimatedCostUsd)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-heading font-extrabold text-ink">
                {testOutput.title}
              </h4>
              <p className="text-xs text-ink-soft mt-1">{testOutput.summary}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {testOutput.pages.map((p) => (
                <div key={p.page_number} className="p-3.5 rounded-2xl bg-surface-2 border border-ink/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-brand-600">Trang {p.page_number}</span>
                    {p.emotion && <span className="text-[11px] text-ink-soft capitalize">{p.emotion}</span>}
                  </div>
                  <p className="text-ink leading-relaxed font-story text-sm">{p.text_content}</p>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-mint/35 border border-success/20 rounded-2xl text-xs font-heading font-bold text-ink">
              💡 Bài học đạo đức: <span className="font-normal text-ink-soft">{testOutput.moral}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
