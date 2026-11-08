import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Check, Sparkles, BookOpen } from 'lucide-react';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { isStoryApproved } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { soundEffects } from '@/lib/sound';

export const KidModePage: React.FC = () => {
  const navigate = useNavigate();
  const { stories, fetchStories } = useStoryStore();
  const { verifyPin } = useAuthStore();

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Parental Gate Modal
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gateType, setGateType] = useState<'hold' | 'math' | 'pin'>('hold');
  const [mathA] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [mathB] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [userAnswer, setUserAnswer] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);

  // Hold-to-exit state (2 seconds press)
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);

  // Kid mode only shows approved stories
  const approvedStories = stories.filter((s) => isStoryApproved(s.status));

  // Request fullscreen on mount or first interaction
  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignored if browser policy requires user gesture
    }
  }, []);

  // Exit fullscreen helper
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored
    }
  }, []);

  // Fullscreen & History Trap Setup
  useEffect(() => {
    requestFullscreen();

    // Trap history navigation
    window.history.pushState({ kidMode: true }, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState({ kidMode: true }, '', window.location.href);
      soundEffects.playLock();
      setIsGateOpen(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [requestFullscreen]);

  // Hold to exit handler (2000ms)
  const startHold = () => {
    holdStartTimeRef.current = Date.now();
    const duration = 2000;

    const tick = () => {
      if (!holdStartTimeRef.current) return;
      const elapsed = Date.now() - holdStartTimeRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(pct);

      if (elapsed >= duration) {
        // Unlocked!
        cancelHold();
        unlockAndExit();
      } else {
        holdTimerRef.current = requestAnimationFrame(tick);
      }
    };

    holdTimerRef.current = requestAnimationFrame(tick);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      cancelAnimationFrame(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdStartTimeRef.current = null;
    setHoldProgress(0);
  };

  const unlockAndExit = async () => {
    soundEffects.playLock();
    setIsGateOpen(false);
    await exitFullscreen();
    navigate('/');
  };

  const handleVerifyGate = () => {
    setGateError(null);
    if (gateType === 'math') {
      const correct = mathA * mathB;
      if (parseInt(userAnswer.trim(), 10) === correct) {
        unlockAndExit();
      } else {
        soundEffects.playTap();
        setGateError(vi.kidMode.wrongAnswer);
      }
    } else if (gateType === 'pin') {
      if (verifyPin(userAnswer.trim())) {
        unlockAndExit();
      } else {
        soundEffects.playTap();
        setGateError('Mã PIN chưa đúng. Vui lòng thử lại!');
      }
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#FFFDF9] text-ink flex flex-col justify-between selection:bg-brand-100 select-none overflow-x-hidden"
      onClick={() => requestFullscreen()}
    >
      {/* 1. TOP HEADER: Cute Mascot & Parental Exit Gate */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-ink/5 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
        
        {/* Mascot & Salutation */}
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-14 h-14 rounded-2xl bg-butter/40 border border-butter/60 flex items-center justify-center text-3xl shadow-sm cursor-pointer"
            onClick={() => soundEffects.playTap()}
          >
            🧸
          </motion.div>
          <div>
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-ink block leading-none">
              Góc Đọc Của Bé
            </span>
            <span className="text-xs font-bold text-brand-600 block mt-1">
              ✨ Chạm vào cuốn sách bé thích nhé!
            </span>
          </div>
        </div>

        {/* Parental Gate Button (Long press or tap to open modal) */}
        <div className="relative">
          <button
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onClick={() => {
              if (holdProgress < 90) {
                setIsGateOpen(true);
              }
            }}
            className="relative px-4 py-2.5 rounded-full bg-surface border border-ink/15 shadow-sm text-ink-soft hover:text-ink flex items-center gap-2 text-xs font-heading font-bold overflow-hidden transition-all min-h-[44px]"
            title="Nhấn để mở cổng phụ huynh, hoặc giữ 2 giây để thoát nhanh"
          >
            {/* Circular or fill progress bar */}
            <div 
              className="absolute inset-0 bg-brand-100 transition-all pointer-events-none" 
              style={{ width: `${holdProgress}%` }}
            />
            <Lock className="w-4 h-4 text-ink-soft relative z-10" />
            <span className="relative z-10 hidden sm:inline">
              {holdProgress > 0 ? `Giữ để thoát...` : 'Cổng phụ huynh'}
            </span>
          </button>
        </div>
      </header>

      {/* 2. MAIN SWIPEABLE STORYSTAGE */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        {approvedStories.length === 0 ? (
          <div className="p-10 rounded-[32px] bg-surface border border-ink/10 shadow-card text-center space-y-4 max-w-md mx-auto">
            <div className="text-7xl animate-bounce">🎨</div>
            <h2 className="text-2xl font-heading font-black text-ink">
              Tủ sách đang chờ đón tranh mới!
            </h2>
            <p className="text-sm font-semibold text-ink-soft">
              Bé hãy nhờ ba mẹ chụp bức vẽ mới để biến thành truyện cổ tích kỳ diệu nhé!
            </p>
            <Button
              variant="primary"
              size="lg"
              className="min-h-[64px] text-base rounded-full"
              onClick={() => setIsGateOpen(true)}
            >
              Nhờ ba mẹ tạo truyện ✨
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Scroll Instructions for Kids */}
            <div className="flex items-center justify-between px-2">
              <span className="text-xs sm:text-sm font-bold font-heading text-ink-soft flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-magic-600" />
                <span>Bé có <strong>{approvedStories.length}</strong> cuốn sách rực rỡ</span>
              </span>
              <span className="text-xs font-bold text-ink-faint hidden sm:inline">
                👈 Cuộn ngang để chọn truyện 👉
              </span>
            </div>

            {/* Giant Horizontal Swipe Cards Container */}
            <div className="flex gap-6 overflow-x-auto pb-6 pt-2 px-2 snap-x snap-mandatory scrollbar-none">
              {approvedStories.map((story) => (
                <div
                  key={story.id}
                  className="snap-center shrink-0 w-[270px] sm:w-[320px] md:w-[340px] flex flex-col rounded-[32px] bg-surface border border-ink/10 shadow-pop overflow-hidden group transition-all transform hover:-translate-y-2"
                >
                  {/* Book Cover Image (3:4 ratio) */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface-2">
                    {/* Spine Gradient */}
                    <div className="absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-black/25 via-black/10 to-transparent z-10" />

                    {story.drawing?.image_path ? (
                      <img
                        src={story.drawing.image_path}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl">
                        📖
                      </div>
                    )}

                    {/* Bottom Title Blur Strip */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 text-white">
                      <h2 className="font-heading font-extrabold text-lg sm:text-xl leading-snug line-clamp-2 drop-shadow-sm">
                        {story.title}
                      </h2>
                      <p className="text-xs font-semibold text-white/90 mt-1 flex items-center gap-1">
                        <span>✨ {story.pages?.length || 4} trang truyện</span>
                      </p>
                    </div>
                  </div>

                  {/* GIANT KID-FRIENDLY BUTTON (Touch target >= 72px) */}
                  <div className="p-4 bg-surface flex flex-col gap-2">
                    <button
                      onClick={() => {
                        soundEffects.playMagic();
                        navigate(`/story/${story.id}`);
                      }}
                      className="w-full min-h-[72px] rounded-full bg-brand-600 hover:bg-brand-700 active:scale-97 text-white font-heading font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-btn-primary transition-all cursor-pointer"
                    >
                      <BookOpen className="w-6 h-6 fill-current" />
                      <span>Mở sách đọc</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 3. BOTTOM CHEERFUL BANNER */}
      <footer className="p-4 bg-surface/60 border-t border-ink/5 text-center text-xs font-bold text-ink-faint">
        DrawToStory · Không gian an toàn dành riêng cho bé yêu 🧸
      </footer>

      {/* PARENTAL GATE MODAL */}
      <Modal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        title="Cổng bảo vệ phụ huynh"
        description="Vui lòng xác nhận để quay lại giao diện quản lý của cha mẹ."
        maxWidth="sm"
      >
        <div className="space-y-5 pt-2">
          
          {/* Gate Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-2 rounded-2xl border border-ink/10">
            <button
              onClick={() => {
                setGateType('math');
                setGateError(null);
                setUserAnswer('');
              }}
              className={`py-2 text-xs font-heading font-bold rounded-xl transition-all min-h-[40px] ${
                gateType === 'math' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft'
              }`}
            >
              Phép tính đố vui
            </button>
            <button
              onClick={() => {
                setGateType('pin');
                setGateError(null);
                setUserAnswer('');
              }}
              className={`py-2 text-xs font-heading font-bold rounded-xl transition-all min-h-[40px] ${
                gateType === 'pin' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft'
              }`}
            >
              Mã PIN phụ huynh
            </button>
          </div>

          {gateType === 'math' ? (
            <div className="text-center p-5 bg-peach/20 rounded-2xl border border-peach">
              <span className="text-xs font-bold text-ink-soft block mb-1">
                Giải phép nhân để tiếp tục:
              </span>
              <span className="text-3xl font-heading font-black text-ink tracking-wider">
                {mathA} &times; {mathB} = ?
              </span>
            </div>
          ) : (
            <div className="p-4 bg-mint/20 rounded-2xl border border-mint text-xs text-ink-soft">
              Nhập mã PIN phụ huynh 4 chữ số (mặc định ban đầu: <strong>1234</strong>)
            </div>
          )}

          <Input
            type={gateType === 'pin' ? 'password' : 'number'}
            placeholder={gateType === 'math' ? 'Nhập kết quả...' : '••••'}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleVerifyGate();
            }}
            error={gateError || undefined}
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsGateOpen(false)}>
              Ở lại góc bé
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!userAnswer.trim()}
              onClick={handleVerifyGate}
              rightIcon={<Check className="w-4 h-4" />}
            >
              Mở khóa phụ huynh
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
