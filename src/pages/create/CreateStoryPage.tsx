import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  Upload, 
  RotateCw, 
  Check, 
  X, 
  ArrowLeft, 
  ShieldCheck, 
  Eye, 
  BookOpen, 
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sun
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';
import { Story, StoryPage } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StoryGenerationService } from '@/features/ai/services/storyGenerationService';

export const CreateStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { childrenList, selectedChildId, setSelectedChildId, addChild } = useAuthStore();
  const { addStory } = useStoryStore();

  // Child selection: auto-skip step 1 if only 1 child
  const initialChild = 
    childrenList.find((c) => c.id === selectedChildId) || 
    childrenList[0] || 
    null;

  const [selectedChild, setSelectedChild] = useState(initialChild);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(
    childrenList.length === 1 ? 2 : 1
  );

  // Quick Child Creation State
  const [isAddingChild, setIsAddingChild] = useState(childrenList.length === 0);
  const [newNickname, setNewNickname] = useState('');
  const [newAge, setNewAge] = useState(5);
  const [newColor, setNewColor] = useState('#FF6B6B');
  const [newEmoji, setNewEmoji] = useState('🐻');
  const [isSubmittingChild, setIsSubmittingChild] = useState(false);

  // Sync selectedChild if childrenList updates
  useEffect(() => {
    if (!selectedChild && childrenList.length > 0) {
      setSelectedChild(childrenList[0]);
      setSelectedChildId(childrenList[0].id);
    }
  }, [childrenList, selectedChild, setSelectedChildId]);

  const handleCreateChild = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newNickname.trim()) {
      toast.error('Mẹ hãy nhập tên thân mật của bé nhé!');
      return;
    }
    setIsSubmittingChild(true);
    try {
      const created = await addChild({
        nickname: newNickname.trim(),
        age: newAge,
        avatar_color: newColor,
        avatar_emoji: newEmoji,
      });
      setSelectedChild(created);
      setSelectedChildId(created.id);
      setIsAddingChild(false);
      setNewNickname('');
      toast.success(`Đã thêm bé ${created.nickname}! Chuẩn bị bước vào bàn vẽ.`);
      setCurrentStep(2);
    } catch {
      toast.error('Có lỗi xảy ra khi tạo hồ sơ cho bé.');
    } finally {
      setIsSubmittingChild(false);
    }
  };

  // Step 2 State: Image & Camera
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  // Live Camera Mode
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Client-side Quality Status
  const [qualityStatus, setQualityStatus] = useState<{
    brightness: 'good' | 'dark' | 'bright';
    sharpness: 'sharp' | 'blurry';
    scoreText: string;
  }>({
    brightness: 'good',
    sharpness: 'sharp',
    scoreText: 'Đủ sáng ✓ Rõ nét ✓',
  });

  // Carousel tips state
  const [tipIndex, setTipIndex] = useState(0);

  // Step 3 State: Magic Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<1 | 2 | 3 | 4>(1);
  const [completedStory, setCompletedStory] = useState<{ story: Story; pages: StoryPage[] } | null>(null);
  const [generationError, setGenerationError] = useState<{
    code: string;
    message: string;
    actionType: 'reupload' | 'library' | 'retry';
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Computer Vision: Brightness & Laplacian Variance for Sharpness
  const analyzeImageMetrics = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = 160;
      const h = 120;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // 1. Brightness (Mean Luminance)
      let totalLuminance = 0;
      const gray = new Float32Array(w * h);
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        totalLuminance += lum;
        gray[i / 4] = lum;
      }
      const avgLum = totalLuminance / (w * h);

      // 2. Sharpness (Laplacian Variance)
      let lapMean = 0;
      let count = 0;
      const lap = new Float32Array((w - 2) * (h - 2));

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const val =
            gray[idx - w] +
            gray[idx - 1] +
            gray[idx + 1] +
            gray[idx + w] -
            4 * gray[idx];
          lap[count] = val;
          lapMean += val;
          count++;
        }
      }
      lapMean /= count || 1;
      let variance = 0;
      for (let i = 0; i < count; i++) {
        variance += (lap[i] - lapMean) * (lap[i] - lapMean);
      }
      const sharpnessVariance = variance / (count || 1);

      const isSharp = sharpnessVariance > 45;
      const isBrightEnough = avgLum >= 65;

      const brightnessStatus: 'good' | 'dark' = isBrightEnough ? 'good' : 'dark';
      const sharpnessStatus: 'sharp' | 'blurry' = isSharp ? 'sharp' : 'blurry';

      let scoreLabel = 'Đủ sáng ✓ Rõ nét ✓';
      if (!isBrightEnough && !isSharp) scoreLabel = 'Hơi tối & Mờ ⚠️';
      else if (!isBrightEnough) scoreLabel = 'Hơi tối ⚠️';
      else if (!isSharp) scoreLabel = 'Hơi rung mờ ⚠️';

      setQualityStatus({
        brightness: brightnessStatus,
        sharpness: sharpnessStatus,
        scoreText: scoreLabel,
      });
    };
    img.src = dataUrl;
  };

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG, WebP)');
      return;
    }
    setImageFile(file);
    setRotation(0);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      analyzeImageMetrics(result);
    };
    reader.readAsDataURL(file);
  };

  // Live Camera Handlers
  const startLiveCamera = async () => {
    try {
      setIsLiveCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      toast.error('Không thể mở camera. Vui lòng cho phép quyền truy cập camera hoặc chọn file tải lên.');
      setIsLiveCameraOpen(false);
    }
  };

  const stopLiveCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraOpen(false);
  }, []);

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `tranh_ve_${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFileSelected(file);
        stopLiveCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  // Start Generation Pipeline
  const handleStartGeneration = async () => {
    if (!selectedChild || !imageFile || !imagePreview) return;

    setCurrentStep(3);
    setIsGenerating(true);
    setGenerationError(null);
    setCompletedStory(null);
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
      setIsGenerating(false);
      setCompletedStory(result);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D13A5E', '#8B7CF6', '#F472B6', '#C9F0DD', '#FFF1B8'],
      });
    } catch (err: unknown) {
      setIsGenerating(false);
      const error = err as Error & { code?: string };
      const code = error.code || 'GENERATION_ERROR';

      if (code === 'NOT_A_DRAWING') {
        setGenerationError({
          code: 'NOT_A_DRAWING',
          message: 'Mình chưa thấy nét vẽ của bé, thử chụp lại tranh trên giấy nhé.',
          actionType: 'reupload',
        });
      } else if (code === 'QUOTA_EXCEEDED') {
        setGenerationError({
          code: 'QUOTA_EXCEEDED',
          message: error.message || 'Bé đã đạt giới hạn truyện trong ngày. Hãy quay lại vào ngày mai nhé!',
          actionType: 'library',
        });
      } else if (code === 'REAL_FACE_DETECTED' || code === 'PII_DETECTED') {
        setGenerationError({
          code: 'SAFETY_BLOCKED',
          message: error.message || 'Bức ảnh có khuôn mặt người thật hoặc thông tin cá nhân. Hãy chỉ chụp phần tranh vẽ của bé.',
          actionType: 'reupload',
        });
      } else {
        setGenerationError({
          code: 'SERVER_ERROR',
          message: error.message || 'Mạng bị gián đoạn hoặc máy chủ đang bận. Mẹ và bé hãy thử lại nhé.',
          actionType: 'retry',
        });
      }
    }
  };

  // Carousel tips content
  const photoTips = [
    {
      title: 'Chụp thẳng góc 90° từ trên xuống',
      desc: 'Đặt giấy vẽ phẳng trên bàn, giữ điện thoại song song để không bị méo góc tranh.',
      badge: 'Mẹo Đúng ✓',
      variant: 'mint' as const,
    },
    {
      title: 'Đủ ánh sáng tự nhiên',
      desc: 'Chụp gần cửa sổ ban ngày hoặc bật đèn sáng đều, tránh để bóng bàn tay đè lên tranh.',
      badge: 'Ánh Sáng Chuẩn ☀️',
      variant: 'butter' as const,
    },
    {
      title: 'Tránh chụp màn hình hoặc logo',
      desc: 'AI chỉ dệt nên truyện từ nét vẽ tay của bé, không áp dụng cho ảnh chụp đời thực hay logo.',
      badge: 'Lưu Ý An Toàn 🛡️',
      variant: 'peach' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
      {/* 1. Slim Topbar with Close Button & 3-Step Stepper */}
      <header className="flex items-center justify-between border-b border-ink/10 pb-4 mb-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-surface border border-ink/15 flex items-center justify-center text-ink hover:bg-surface-2 transition-colors cursor-pointer shadow-xs"
          aria-label="Đóng trình tạo truyện"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Stepper (3 Steps) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {[
            { step: 1, label: 'Chọn bé' },
            { step: 2, label: 'Bàn vẽ' },
            { step: 3, label: 'Phép màu' },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isDone = currentStep > item.step;

            return (
              <div
                key={item.step}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-btn-primary'
                    : isDone
                    ? 'bg-mint text-[#166E48]'
                    : 'bg-surface-2 text-ink-faint'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px]">
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : item.step}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="w-10" />
      </header>

      {/* 2. STEP 1: CHỌN HOẶC TẠO HỒ SƠ BÉ */}
      {currentStep === 1 && (
        <main className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink tracking-tight">
              {childrenList.length === 0 ? 'Chào mừng Mẹ và Bé!' : 'Bé nào sẽ là nhân vật chính hôm nay?'}
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft">
              {childrenList.length === 0
                ? 'Hãy thêm hồ sơ của bé để AI cá nhân hóa câu chuyện theo độ tuổi và sở thích.'
                : 'Chọn hồ sơ bé để AI điều chỉnh độ tuổi và ngôn ngữ câu chuyện thích hợp nhất.'}
            </p>
          </div>

          {/* If no children or user clicked "+ Thêm bé mới", show creation form */}
          {childrenList.length === 0 || isAddingChild ? (
            <form
              onSubmit={handleCreateChild}
              className="p-6 bg-surface rounded-[28px] border border-ink/10 shadow-card space-y-5"
            >
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  <h2 className="font-heading font-extrabold text-base text-ink">
                    {childrenList.length === 0 ? 'Tạo hồ sơ đầu tiên cho bé' : 'Thêm hồ sơ bé mới'}
                  </h2>
                </div>
                {childrenList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingChild(false)}
                    className="text-xs text-ink-soft hover:text-ink font-bold"
                  >
                    Hủy bỏ
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  Tên thân mật của bé *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bống, Nhím, Tít, Sóc, Tin Tin..."
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-ink/15 focus:outline-none focus:border-brand-600 font-bold text-sm bg-surface-2 text-ink transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  Độ tuổi của bé: <span className="text-brand-600 font-extrabold">{newAge} tuổi</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((age) => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setNewAge(age)}
                      className={`w-9 h-9 rounded-xl text-xs font-heading font-bold transition-all ${
                        newAge === age
                          ? 'bg-brand-600 text-white shadow-btn-primary scale-105'
                          : 'bg-surface-2 text-ink-soft hover:bg-surface-3'
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">Emoji yêu thích</label>
                  <div className="flex flex-wrap gap-2">
                    {['🐻', '🐰', '🦁', '🐱', '🦄', '🚀', '🌟', '🎨'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewEmoji(emoji)}
                        className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center transition-all ${
                          newEmoji === emoji ? 'bg-brand-100 ring-2 ring-brand-600 scale-105 shadow-xs' : 'bg-surface-2'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">Màu đại diện</label>
                  <div className="flex items-center gap-2.5 pt-1">
                    {['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#9D4EDD', '#FF8E53'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          newColor === color ? 'ring-3 ring-brand-600 ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-ink/10">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={isSubmittingChild}
                  className="w-full"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Lưu hồ sơ bé & Bắt đầu sáng tạo tranh
                </Button>
              </div>
            </form>
          ) : (
            <>
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
                      className={`p-5 rounded-[24px] border-2 cursor-pointer transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'bg-surface border-brand-600 shadow-card ring-2 ring-brand-100 scale-102'
                          : 'bg-surface border-ink/10 hover:border-ink/25 shadow-xs'
                      }`}
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xs shrink-0"
                        style={{ backgroundColor: kid.avatar_color + '35' }}
                      >
                        {kid.avatar_emoji}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <span className="font-heading font-extrabold text-base text-ink block truncate">
                          {kid.nickname}
                        </span>
                        <span className="text-xs text-brand-600 font-bold block mt-0.5">
                          {kid.age} tuổi
                        </span>
                        <span className="text-[11px] text-ink-faint block mt-0.5">
                          {kid.age <= 5 ? 'Ngôn từ vui nhộn, lặp âm' : 'Cốt truyện phiêu lưu giàu cảm xúc'}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-btn-primary">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingChild(true)}
                  className="px-4 py-2 rounded-full border border-dashed border-ink/20 text-xs font-bold text-ink-soft hover:text-brand-600 hover:border-brand-600 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  + Thêm hồ sơ bé khác
                </button>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-ink/10">
                <span className="text-xs text-ink-soft">
                  Đang chọn: <strong className="text-brand-600">{selectedChild?.nickname || 'Chưa chọn'}</strong>
                </span>
                <Button
                  variant="primary"
                  size="md"
                  disabled={!selectedChild}
                  onClick={() => setCurrentStep(2)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Tiếp tục vào bàn vẽ
                </Button>
              </div>
            </>
          )}
        </main>
      )}

      {/* 3. STEP 2: BÀN VẼ & CHỤP TRANH */}
      {currentStep === 2 && (
        <main className="flex-1 flex flex-col justify-center space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink tracking-tight">
              Đặt bức tranh của {selectedChild?.nickname || 'bé'} lên bàn vẽ
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft">
              Chụp ảnh hoặc tải lên tranh vẽ tay của bé để chuẩn bị cho khoảnh khắc thần kỳ.
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
            }}
          />

          {!imagePreview ? (
            /* Large Drop Zone "Bàn vẽ" */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileSelected(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-ink/20 bg-surface rounded-[32px] p-8 sm:p-14 text-center cursor-pointer hover:border-brand-600 hover:bg-brand-100/10 transition-all flex flex-col items-center justify-center gap-4 group shadow-card"
            >
              <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform shadow-xs">
                🎨
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-extrabold text-lg text-ink">
                  Kéo thả tranh của bé vào đây, hoặc bấm để chọn ảnh
                </h3>
                <p className="text-xs text-ink-soft max-w-md mx-auto leading-relaxed">
                  Hỗ trợ định dạng JPG, PNG, WebP (dung lượng tối đa 15MB, tự động tối ưu hóa phía máy khách).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  leftIcon={<Camera className="w-4 h-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    startLiveCamera();
                  }}
                >
                  Chụp bằng Camera
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Chọn ảnh từ máy
                </Button>
              </div>
            </div>
          ) : (
            /* Image Preview on Polaroid Stage with Rotation & Quality Chips */
            <div className="space-y-4">
              <div className="relative aspect-[4/3] w-full max-w-xl mx-auto rounded-[28px] overflow-hidden bg-surface-2 border border-ink/10 flex items-center justify-center shadow-card p-4">
                <img
                  src={imagePreview}
                  alt="Tranh vẽ bé yêu"
                  style={{ transform: `rotate(${rotation}deg)` }}
                  className="max-h-full max-w-full object-contain rounded-2xl transition-transform duration-300"
                />

                {/* Quality Status Chip Overlay */}
                <div className="absolute top-4 left-4 z-10">
                  <Badge 
                    variant={qualityStatus.brightness === 'good' && qualityStatus.sharpness === 'sharp' ? 'success' : 'warning'} 
                    size="sm"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>{qualityStatus.scoreText}</span>
                  </Badge>
                </div>

                {/* Floating Rotation & Change Controls */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-ink/75 backdrop-blur-md p-1.5 rounded-full text-white shadow-pop z-10">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                    title="Xoay tranh 90 độ"
                    aria-label="Xoay tranh"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="text-xs font-heading font-bold px-3 py-1 rounded-full hover:bg-white/20 transition-colors min-h-[36px] flex items-center cursor-pointer"
                  >
                    Chọn ảnh khác
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Carousel "Mẹo chụp đẹp" (Đúng & Sai) */}
          <div className="p-4 rounded-2xl bg-surface border border-ink/10 shadow-xs flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setTipIndex((prev) => (prev > 0 ? prev - 1 : photoTips.length - 1))}
              className="p-2 rounded-full hover:bg-surface-2 text-ink-faint hover:text-ink transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Mẹo trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5">
                <Badge variant={photoTips[tipIndex].variant} size="sm">
                  {photoTips[tipIndex].badge}
                </Badge>
                <span className="text-xs font-heading font-extrabold text-ink">
                  {photoTips[tipIndex].title}
                </span>
              </div>
              <p className="text-[11px] text-ink-soft">
                {photoTips[tipIndex].desc}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setTipIndex((prev) => (prev < photoTips.length - 1 ? prev + 1 : 0))}
              className="p-2 rounded-full hover:bg-surface-2 text-ink-faint hover:text-ink transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Mẹo tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Step 2 Bottom Action Bar */}
          <div className="pt-4 flex items-center justify-between border-t border-ink/10">
            {childrenList.length > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => setCurrentStep(1)}
              >
                Chọn lại bé
              </Button>
            ) : (
              <div />
            )}

            <Button
              variant="magic"
              size="lg"
              disabled={!imagePreview}
              leftIcon={<Sparkles className="w-5 h-5 animate-pulse" />}
              onClick={handleStartGeneration}
              disabledTooltip={!imagePreview ? 'Hãy chụp hoặc chọn ảnh tranh vẽ trước' : undefined}
            >
              Thần kỳ hóa thành truyện
            </Button>
          </div>
        </main>
      )}

      {/* 4. STEP 3: MÀN HÌNH PHÉP MÀU (Toàn khung hình & Confetti) */}
      {currentStep === 3 && (
        <main className="flex-1 flex flex-col justify-center items-center py-6">
          {isGenerating ? (
            /* Progress State */
            <div className="w-full max-w-lg mx-auto text-center space-y-8">
              {/* Center Artwork in Polaroid Frame with Floating Sparkles */}
              <div className="relative inline-block">
                <div className="p-3 bg-surface rounded-2xl shadow-card border border-ink/10 max-w-[240px] mx-auto rotate-[-1.5deg]">
                  <div className="w-48 h-36 rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Tranh vẽ đang tạo"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="mt-2 text-xs font-heading font-extrabold text-ink truncate">
                    Nét vẽ của {selectedChild?.nickname}
                  </div>
                </div>

                {/* Floating Magic Stars */}
                <Sparkles className="w-6 h-6 text-[#8B7CF6] absolute -top-3 -right-3 animate-spin" />
                <Sparkles className="w-5 h-5 text-[#F472B6] absolute -bottom-2 -left-3 animate-bounce" />
              </div>

              {/* Progress Title & 4 Real Stages */}
              <div className="space-y-3">
                <h2 className="text-2xl font-heading font-extrabold text-ink tracking-tight">
                  Phép màu AI đang dệt truyện...
                </h2>

                <p className="text-sm font-heading font-bold text-brand-600">
                  {generationStage === 1 && 'Giai đoạn 1/4: Ngắm nhìn bức tranh & nhận diện đồ vật'}
                  {generationStage === 2 && 'Giai đoạn 2/4: Thẩm định an toàn 3 lớp Responsible AI'}
                  {generationStage === 3 && 'Giai đoạn 3/4: Dệt nên câu chuyện cổ tích 4 trang'}
                  {generationStage === 4 && 'Giai đoạn 4/4: Soát lại câu từ & chấm điểm bám tranh'}
                </p>

                {/* Circular / Linear Progress Bar */}
                <div className="w-full bg-surface-2 h-2.5 rounded-full overflow-hidden border border-ink/10 p-0.5 max-w-md mx-auto">
                  <motion.div
                    className="bg-gradient-to-r from-[#8B7CF6] to-[#F472B6] h-full rounded-full"
                    animate={{ width: `${generationStage * 25}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* 4 Real Stages Indicator Grid */}
              <div className="grid grid-cols-4 gap-2 text-[10px] font-heading font-bold">
                {[
                  { stage: 1, label: 'Thấu cảm', icon: Eye },
                  { stage: 2, label: 'An toàn', icon: ShieldCheck },
                  { stage: 3, label: 'Sáng tác', icon: BookOpen },
                  { stage: 4, label: 'Giám định', icon: Sparkles },
                ].map((s) => {
                  const isDone = generationStage >= s.stage;
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.stage}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                        isDone
                          ? 'text-brand-600 bg-brand-100/60 border-brand-400/40 shadow-xs'
                          : 'text-ink-faint bg-surface border-ink/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : completedStory ? (
            /* Book Opening & Done Celebration */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="text-center space-y-6 max-w-md mx-auto"
            >
              <div className="relative inline-block rotate-[-1deg]">
                <div className="p-4 bg-surface rounded-[28px] shadow-pop border border-ink/10 max-w-[260px] mx-auto">
                  <div className="w-52 h-40 rounded-2xl overflow-hidden bg-surface-2 relative shadow-inner">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt={completedStory.story.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <h3 className="font-heading font-extrabold text-sm text-ink mt-3 line-clamp-1">
                    {completedStory.story.title}
                  </h3>
                  <Badge variant="success" size="sm" className="mt-1">
                    Độ bám tranh: {completedStory.story.faithfulness_score || 90}/100
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink tracking-tight">
                  Cuốn sách tranh đã sẵn sàng! 🎉
                </h2>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Câu chuyện cổ tích 4 trang được dệt nên chuẩn mực từ nét vẽ của bé{' '}
                  <strong className="text-ink">{selectedChild?.nickname}</strong>.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(`/story/${completedStory.story.id}`)}
                  leftIcon={<BookOpen className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                >
                  Đọc ngay cùng bé
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/library')}
                  className="w-full sm:w-auto"
                >
                  Về tủ sách
                </Button>
              </div>
            </motion.div>
          ) : generationError ? (
            /* Friendly Error Screens */
            <div className="max-w-md mx-auto text-center space-y-5 p-6 rounded-[32px] bg-surface border border-ink/10 shadow-card">
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-100 flex items-center justify-center text-3xl shadow-xs">
                {generationError.code === 'NOT_A_DRAWING' ? '🎨' : generationError.code === 'QUOTA_EXCEEDED' ? '⏳' : '🛡️'}
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-heading font-extrabold text-ink">
                  {generationError.code === 'NOT_A_DRAWING'
                    ? 'Chưa nhận diện được tranh vẽ'
                    : generationError.code === 'QUOTA_EXCEEDED'
                    ? 'Đã đạt giới hạn hôm nay'
                    : 'Không thể tạo truyện'}
                </h2>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  {generationError.message}
                </p>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                {generationError.actionType === 'reupload' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentStep(2)}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Chụp lại bức tranh khác
                  </Button>
                )}

                {generationError.actionType === 'retry' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleStartGeneration}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Thử lại
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/')}
                >
                  Về trang chủ
                </Button>
              </div>
            </div>
          ) : null}
        </main>
      )}

      {/* 5. Live Camera Fullscreen Modal Overlay */}
      <AnimatePresence>
        {isLiveCameraOpen && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 sm:p-6 text-white">
            {/* Camera Header */}
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-heading font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                Căn tranh vào giữa khung viền
              </span>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 cursor-pointer"
                aria-label="Đóng camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport with Guide Frame Overlay */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden my-4">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover rounded-2xl"
              />

              {/* Guide Overlay Rectangle */}
              <div className="absolute inset-8 sm:inset-16 border-2 border-dashed border-white/80 rounded-2xl pointer-events-none flex items-center justify-center">
                <span className="text-xs font-heading font-bold text-white/70 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                  Khung viền trang giấy vẽ
                </span>
              </div>
            </div>

            {/* Camera Capture Trigger Button */}
            <div className="flex items-center justify-center pb-4 z-10">
              <button
                type="button"
                onClick={capturePhotoFromCamera}
                className="w-18 h-18 rounded-full border-4 border-white bg-brand-600 shadow-pop flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
                aria-label="Chụp ảnh ngay"
              >
                <Camera className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
