import React, { useState } from 'react';
import { Save, Check, Play, History, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
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

  // Playground state
  const [sampleNickname, setSampleNickname] = useState('Bé Bơ');
  const [sampleAge, setSampleAge] = useState(5);
  const [sampleDetails, setSampleDetails] = useState('Một chú voi con có đôi tai màu hồng và chiếc cầu vồng bảy sắc');
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<{
    title: string;
    summary: string;
    moral: string;
    pages: Array<{ page_number: number; text_content: string }>;
    metrics: { inputTokens: number; outputTokens: number; latencyMs: number };
  } | null>(null);

  const selectedPrompt = systemPrompts.find((p) => p.id === selectedPromptId) || activePrompt;

  const handleSelectPrompt = (promptId: string) => {
    setSelectedPromptId(promptId);
    const p = systemPrompts.find((item) => item.id === promptId);
    if (p) {
      setEditorText(p.prompt_text);
    }
  };

  const handleSaveAsNewVersion = () => {
    if (!newVersionName.trim()) {
      toast.error('Vui lòng nhập tên cho phiên bản mới');
      return;
    }
    saveSystemPromptVersion(newVersionName.trim(), editorText);
    toast.success('Đã lưu phiên bản System Prompt mới!');
    setNewVersionName('');
  };

  const handleRunPlayground = async () => {
    setIsTesting(true);
    setTestOutput(null);

    // Simulate Playground execution via admin-test-prompt
    setTimeout(() => {
      setIsTesting(false);
      setTestOutput({
        title: `Chú Voi Con và Cầu Vồng Lấp Lánh (${sampleNickname})`,
        summary: `Câu chuyện thử nghiệm sáng tác cho bé ${sampleNickname} (${sampleAge} tuổi) từ nét vẽ chú voi tai hồng.`,
        moral: 'Tình bạn và sự sẻ chia luôn thắp sáng mọi chân trời cổ tích.',
        pages: [
          { page_number: 1, text_content: `Buổi sáng nọ, bạn nhỏ ${sampleNickname} dạo chơi cùng một chú voi con có đôi tai hồng rực rỡ dưới ánh nắng mai ấm áp.` },
          { page_number: 2, text_content: 'Sau cơn mưa rào mùa hạ, chiếc cầu vồng bảy sắc lung linh vắt ngang sườn đồi xanh mướt như một dải lụa tiên sa.' },
          { page_number: 3, text_content: 'Voi con thích thú vẫy chiếc vòi nhỏ, thổi những giọt nước lấp lánh hòa vào bảy sắc cầu vồng rộn rã tiếng cười.' },
          { page_number: 4, text_content: 'Các bạn thú nhỏ cùng nắm tay nhau nhảy múa hân hoan. Một ngày tuyệt đẹp khép lại trong tình yêu thương ngọt ngào.' },
        ],
        metrics: {
          inputTokens: 980,
          outputTokens: 420,
          latencyMs: 1850,
        },
      });
      toast.success('Đã chạy thử nghiệm Prompt thành công!');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-main">
          {vi.admin.prompts.title}
        </h1>
        <p className="text-xs sm:text-sm text-main-muted mt-1">
          {vi.admin.prompts.subtitle}
        </p>
      </div>

      {/* Editor & Version History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Version History (Left 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card variant="white" className="p-5 border-2 border-peach/50 space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-accent" />
              <h2 className="font-heading font-bold text-sm text-main">
                {vi.admin.prompts.versionHistory}
              </h2>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {systemPrompts.map((p) => {
                const isCurrent = p.id === selectedPromptId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPrompt(p.id)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-accent/10 border-accent shadow-soft'
                        : 'bg-cream-100 border-peach/40 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-heading font-bold text-xs text-main truncate">
                        {p.name}
                      </span>
                      {p.is_active ? (
                        <Badge variant="mint" size="sm">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          v{p.version}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-peach/20">
                      <span className="text-[10px] text-main-muted">
                        Phiên bản {p.version}
                      </span>
                      {!p.is_active && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSystemPrompt(p.id);
                            toast.success(`Đã kích hoạt phiên bản v${p.version} làm Active!`);
                          }}
                          className="text-[10px] font-heading font-bold text-accent hover:underline"
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
          <Card variant="white" className="p-6 md:p-8 border-2 border-peach/50 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-heading font-bold text-main-muted">
                  Đang chỉnh sửa:
                </span>
                <h3 className="text-lg font-heading font-black text-main">
                  {selectedPrompt?.name} {selectedPrompt?.is_active && '(Đang chạy chính thức)'}
                </h3>
              </div>

              {selectedPrompt && !selectedPrompt.is_active && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => {
                    setActiveSystemPrompt(selectedPrompt.id);
                    toast.success('Đã kích hoạt phiên bản làm Active!');
                  }}
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
            <div className="p-4 rounded-2xl bg-cream-100 border border-peach/40 flex flex-col sm:flex-row items-center gap-3">
              <Input
                placeholder="Tên phiên bản mới (ví dụ: v1.3 - Giọng kể giàu biểu cảm)"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                className="bg-white"
              />
              <Button
                variant="primary"
                size="md"
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

      {/* Interactive Prompt Playground */}
      <Card variant="cream" className="p-6 md:p-8 border-2 border-peach space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            <h2 className="text-lg md:text-xl font-heading font-black text-main">
              {vi.admin.prompts.playgroundTitle}
            </h2>
          </div>
          <Badge variant="accent" size="sm">
            Thử nghiệm an toàn (Không ghi DB)
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
            label="Chi tiết nét vẽ mẫu"
            value={sampleDetails}
            onChange={(e) => setSampleDetails(e.target.value)}
          />
        </div>

        <Button
          variant="accent"
          size="md"
          isLoading={isTesting}
          onClick={handleRunPlayground}
          leftIcon={<Play className="w-4 h-4" />}
        >
          {vi.admin.prompts.testSampleImage}
        </Button>

        {/* Playground Output */}
        {testOutput && (
          <div className="p-5 rounded-2xl bg-white border border-peach/50 space-y-4 shadow-soft animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading font-bold text-accent">
                {vi.admin.prompts.testOutput}
              </span>
              <div className="flex items-center gap-3 text-main-muted">
                <span>Tokens: {testOutput.metrics.inputTokens + testOutput.metrics.outputTokens}</span>
                <span>Latency: {testOutput.metrics.latencyMs}ms</span>
              </div>
            </div>

            <div>
              <h4 className="text-base font-heading font-black text-main">
                {testOutput.title}
              </h4>
              <p className="text-xs text-main-muted mt-0.5">{testOutput.summary}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {testOutput.pages.map((p) => (
                <div key={p.page_number} className="p-3 rounded-xl bg-cream-100 border border-peach/30">
                  <span className="font-bold text-primary block mb-1">Trang {p.page_number}:</span>
                  <p className="text-main">{p.text_content}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-peach/20 rounded-xl text-xs font-semibold text-main">
              💡 Bài học đạo đức: {testOutput.moral}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
