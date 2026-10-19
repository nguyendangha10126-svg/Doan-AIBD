import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Upload, 
  RotateCw, 
  Check, 
  ArrowLeft, 
  AlertTriangle, 
  ShieldCheck, 
  Eye, 
  BookOpen, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StoryGenerationService } from '@/features/ai/services/storyGenerationService';

export const CreateStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { childrenList, selectedChildId, setSelectedChildId } = useAuthStore();
  const { addStory } = useStoryStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedChild, setSelectedChild] = useState(
    childrenList.find((c) => c.id === selectedChildId) || childrenList[0]
  );

  // Step 2 State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Step 3 (Generation) State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<1 | 2 | 3 | 4>(1);
  const [generationError, setGenerationError] = useState<{ code: string; message: string } | null>(null);

  useEffect(() => {
    if (selectedChildId) {
      const child = childrenList.find((c) => c.id === selectedChildId);
      if (child) setSelectedChild(child);
    }
  }, [selectedChildId, childrenList]);

  // Image brightness & blur heuristic detection
  const analyzeImageQuality = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 100, 100);
      const imgData = ctx.getImageData(0, 0, 100, 100);
      let totalLuminance = 0;

      for (let i = 0; i < imgData.data.length; i += 4) {
        const r = imgData.data[i];
        const g = imgData.data[i + 1];
        const b = imgData.data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += luminance;
      }

      const avgLuminance = totalLuminance / (imgData.data.length / 4);
      if (avgLuminance < 60) {
        setImageWarning(vi.createStory.brightnessWarning);
      } else {
        setImageWarning(null);
      }
    };
    img.src = dataUrl;
  };

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG)');
      return;
    }

    setImageFile(file);
    setRotation(0);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      analyzeImageQuality(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleStartGeneration = async () => {
    if (!selectedChild || !imageFile || !imagePreview) return;

    setCurrentStep(3);
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStage(1);

    try {
      const result = await StoryGenerationService.generateStory({
        childId: selectedChild.id,
        childNickname: selectedChild.nickname,
        childAge: selectedChild.age,
        drawingFile: imageFile,
        drawingPreviewUrl: imagePreview,
        onStageChange: (stage) => setGenerationStage(stage),
      });

      // Save to store
      addStory(result.story);

      if (result.story.status === 'pending_review') {
        toast.info(vi.createStory.pendingModerationNotice);
        navigate('/library');
      } else if (result.story.status === 'rejected') {
        setGenerationError({
          code: 'REJECTED',
          message: result.story.rejection_reason || 'Bức tranh cần được vẽ lại cho phù hợp với bé.',
        });
        setIsGenerating(false);
      } else {
        toast.success('Câu chuyện thần kỳ đã hoàn thành! 🎉');
        navigate(`/story/${result.story.id}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setIsGenerating(false);
      setGenerationError({
        code: 'GENERATION_ERROR',
        message: error.message || 'Không thể tạo truyện. Vui lòng thử lại sau giây lát.',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-heading font-black text-main">
          {vi.createStory.title}
        </h1>
        <p className="text-xs md:text-sm text-main-muted">
          {vi.createStory.subtitle}
        </p>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 pt-3">
          {[
            { step: 1, label: vi.createStory.step1Tab },
            { step: 2, label: vi.createStory.step2Tab },
            { step: 3, label: vi.createStory.step3Tab },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isDone = currentStep > item.step;

            return (
              <div
                key={item.step}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-soft ring-2 ring-primary/30'
                    : isDone
                    ? 'bg-mint text-emerald-800'
                    : 'bg-white/70 text-main-muted'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[11px]">
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : item.step}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: CHỌN BÉ */}
      {currentStep === 1 && (
        <Card variant="white" className="p-6 md:p-8 space-y-6 animate-fadeIn">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-heading font-bold text-main">
              {vi.createStory.chooseChildHeading}
            </h2>
            <p className="text-xs text-main-muted">
              {vi.createStory.chooseChildSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {childrenList.map((kid) => {
              const isSelected = selectedChild?.id === kid.id;
              return (
                <div
                  key={kid.id}
                  onClick={() => {
                    setSelectedChild(kid);
                    setSelectedChildId(kid.id);
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'bg-primary-light border-primary shadow-soft scale-102 ring-2 ring-primary/20'
                      : 'bg-cream-100 border-peach/40 hover:bg-white hover:border-peach'
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-soft shrink-0"
                    style={{ backgroundColor: kid.avatar_color + '30' }}
                  >
                    {kid.avatar_emoji}
                  </div>
                  <div className="flex-1">
                    <span className="font-heading font-black text-base text-main block">
                      {kid.nickname}
                    </span>
                    <span className="text-xs text-primary-dark font-bold block mt-0.5">
                      {kid.age} {vi.dashboard.childCardAge}
                    </span>
                    <span className="text-[11px] text-main-muted block mt-1">
                      {kid.age <= 5 ? 'Câu ngắn, lặp âm vui tươi' : 'Cốt truyện phiêu lưu giàu tưởng tượng'}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-peach/30">
            <span className="text-xs text-main-muted">
              Đang chọn: <strong className="text-main">{selectedChild?.nickname}</strong>
            </span>

            <Button
              variant="primary"
              size="md"
              disabled={!selectedChild}
              onClick={() => setCurrentStep(2)}
            >
              {vi.onboarding.next}
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: CHỤP & UPLOAD TRANH */}
      {currentStep === 2 && (
        <Card variant="white" className="p-6 md:p-8 space-y-6 animate-fadeIn">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-heading font-bold text-main">
              {vi.createStory.uploadHeading}
            </h2>
            <p className="text-xs text-main-muted">
              {vi.createStory.uploadSubtitle}
            </p>
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
            }}
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
            }}
          />

          {!imagePreview ? (
            /* Upload Drop Area */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileSelected(e.dataTransfer.files[0]);
              }}
              className="border-3 border-dashed border-peach rounded-3xl p-8 md:p-12 text-center cursor-pointer hover:bg-peach/10 transition-all flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-20 h-20 rounded-full bg-peach/40 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-soft">
                🎨
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-main">
                  {vi.createStory.dragDropText}
                </h3>
                <p className="text-xs text-main-muted mt-1 max-w-sm">
                  {vi.createStory.maxSizeNotice}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Camera className="w-4 h-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                >
                  {vi.createStory.cameraButton}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  {vi.createStory.browseButton}
                </Button>
              </div>
            </div>
          ) : (
            /* Image Preview Area with Controls */
            <div className="space-y-4">
              <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-cream-200 border-2 border-peach/50 flex items-center justify-center shadow-soft">
                <img
                  src={imagePreview}
                  alt="Tranh vẽ của bé"
                  style={{ transform: `rotate(${rotation}deg)` }}
                  className="max-h-full max-w-full object-contain transition-transform duration-300"
                />

                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-main/60 backdrop-blur-md p-1.5 rounded-full text-white">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title={vi.createStory.rotateButton}
                    aria-label={vi.createStory.rotateButton}
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="text-xs font-heading font-bold px-3 py-1 rounded-full hover:bg-white/20 transition-colors min-h-[36px] flex items-center"
                  >
                    {vi.createStory.reuploadButton}
                  </button>
                </div>
              </div>

              {imageWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{imageWarning}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-peach/30">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setCurrentStep(1)}
            >
              {vi.reader.previousPage}
            </Button>

            <Button
              variant="accent"
              size="lg"
              disabled={!imagePreview}
              leftIcon={<Sparkles className="w-5 h-5 animate-pulse" />}
              onClick={handleStartGeneration}
              className="shadow-soft hover:shadow-glow-accent"
            >
              {vi.createStory.generateButton}
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: MÀN HÌNH PHÉP THUẬT & LOADING NHIỀU GIAI ĐOẠN */}
      {currentStep === 3 && (
        <Card variant="white" className="p-8 md:p-12 text-center space-y-6">
          {isGenerating ? (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-accent animate-spin opacity-30 blur-md" />
                <div className="w-24 h-24 rounded-full bg-white shadow-soft-lg flex items-center justify-center text-5xl animate-bounce">
                  ✨
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-heading font-black text-main">
                  {vi.createStory.progressTitle}
                </h2>
                <p className="text-sm font-bold text-accent">
                  {generationStage === 1 && vi.createStory.stage1}
                  {generationStage === 2 && vi.createStory.stage2}
                  {generationStage === 3 && vi.createStory.stage3}
                  {generationStage === 4 && vi.createStory.stage4}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-cream-200 h-3 rounded-full overflow-hidden p-0.5 border border-peach/40">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${generationStage * 25}%` }}
                />
              </div>

              {/* Stage Indicators */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] font-heading font-bold">
                {[
                  { stage: 1, label: 'Thấu cảm', icon: Eye },
                  { stage: 2, label: 'An toàn', icon: ShieldCheck },
                  { stage: 3, label: 'Viết truyện', icon: BookOpen },
                  { stage: 4, label: 'Hoàn tất', icon: Sparkles },
                ].map((s) => {
                  const isDone = generationStage >= s.stage;
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.stage}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        isDone ? 'text-primary bg-primary-light/50' : 'text-main-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : generationError ? (
            /* Error & Unsafe Handling */
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-4xl shadow-soft">
                {generationError.code === 'QUOTA_EXCEEDED' ? '⏳' : '🛡️'}
              </div>

              <h2 className="text-2xl font-heading font-black text-main">
                {generationError.code === 'QUOTA_EXCEEDED'
                  ? vi.createStory.quotaExceededTitle
                  : vi.createStory.unsafeTitle}
              </h2>

              <p className="text-sm text-main-muted leading-relaxed">
                {generationError.message}
              </p>

              <div className="pt-4 flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Chọn bức tranh khác
                </Button>
                <Button variant="primary" onClick={() => navigate('/')}>
                  {vi.nav.home}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
};
