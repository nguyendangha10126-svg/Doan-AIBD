import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Check, Sparkles, BookOpen } from 'lucide-react';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { formatChildName } from '@/lib/utils';
import { isStoryApproved } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { soundEffects } from '@/lib/sound';

function generateChallengePair(): [number, number] {
  // Multi-digit × single-digit challenge suitable for adults, preventing young children from guessing
  const a = Math.floor(Math.random() * 8) + 12; // 12..19
  const b = Math.floor(Math.random() * 4) + 6;  // 6..9
  return [a, b];
}

export const KidModePage: React.FC = () => {
  const navigate = useNavigate();
  const { stories, fetchStories } = useStoryStore();
  const { childrenList, selectedChildId, verifyPin, hasPinConfigured } = useAuthStore();

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const pinConfigured = hasPinConfigured();

  // Parental Gate Modal
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gateType, setGateType] = useState<'math' | 'pin'>(pinConfigured ? 'pin' : 'math');
  const [[mathA, mathB], setMathPair] = useState<[number, number]>(() => generateChallengePair());
  const [userAnswer, setUserAnswer] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);

  const activeChild =
    childrenList.find((c) => c.id === selectedChildId) || childrenList[0] || null;

  // Kid mode only shows approved stories belonging to the active child
  const approvedStories = activeChild
    ? stories.filter((s) => isStoryApproved(s.status) && s.child_id === activeChild.id)
    : [];

  const openParentalGate = useCallback(() => {
    soundEffects.playLock();
    setMathPair(generateChallengePair());
    setGateType(hasPinConfigured() ? 'pin' : 'math');
    setUserAnswer('');
    setGateError(null);
    setIsGateOpen(true);
  }, [hasPinConfigured]);

  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignored if browser policy requires user gesture
    }
  }, []);

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
    window.history.pushState({ kidMode: true }, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState({ kidMode: true }, '', window.location.href);
      openParentalGate();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [requestFullscreen, openParentalGate]);

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
        setMathPair(generateChallengePair());
        setUserAnswer('');
        setGateError(vi.kidMode.wrongAnswer);
      }
    } else {
      if (!pinConfigured) {
        setGateType('math');
        setGateError('Gia đình chưa đặt mã PIN riêng. Vui lòng giải phép tính để mở khóa.');
        return;
      }
      if (verifyPin(userAnswer.trim())) {
        unlockAndExit();
      } else {
        soundEffects.playTap();
        setUserAnswer('');
        setGateError('Mã PIN phụ huynh chưa chính xác. Vui lòng thử lại!');
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-[#FFFDF9] text-ink flex flex-col justify-between selection:bg-brand-100 select-none overflow-x-hidden"
      onClick={() => requestFullscreen()}
    >
      {/* 1. TOP HEADER: Cute Mascot & Parental Exit Gate */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-ink/5 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-butter/40 border border-butter/60 flex items-center justify-center text-3xl shadow-sm cursor-pointer shrink-0"
            onClick={() => soundEffects.playTap()}
          >
            🧸
          </motion.div>
          <div className="min-w-0">
            <span className="font-heading font-extrabold text-lg sm:text-2xl text-ink block leading-tight truncate">
              Góc Đọc Của {activeChild ? formatChildName(activeChild.nickname) : 'Bé'}
            </span>
            <span className="text-xs font-bold text-brand-600 block mt-0.5 truncate">
              ✨ Chạm vào cuốn sách bé thích nhé!
            </span>
          </div>
        </div>

        {/* Parental Gate Button (Always requires verification) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openParentalGate();
          }}
          className="px-4 py-2.5 rounded-full bg-surface border border-ink/15 shadow-sm text-ink-soft hover:text-ink flex items-center gap-2 text-xs font-heading font-bold transition-all min-h-[44px] shrink-0 cursor-pointer"
          aria-label="Mở cổng bảo vệ phụ huynh"
        >
          <Lock className="w-4 h-4 text-ink-soft" />
          <span className="hidden sm:inline">Cổng phụ huynh</span>
        </button>
      </header>

      {/* 2. MAIN SWIPEABLE STORYSTAGE */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        {approvedStories.length === 0 ? (
          <div className="p-8 sm:p-10 rounded-[32px] bg-surface border border-ink/10 shadow-card text-center space-y-4 max-w-md mx-auto">
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
              className="min-h-[60px] text-base rounded-full"
              onClick={openParentalGate}
            >
              Nhờ ba mẹ tạo truyện ✨
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs sm:text-sm font-bold font-heading text-ink-soft flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-magic-600" />
                <span>
                  {activeChild ? formatChildName(activeChild.nickname) : 'Bé'} có{' '}
                  <strong>{approvedStories.length}</strong> cuốn sách rực rỡ
                </span>
              </span>
              <span className="text-xs font-bold text-ink-faint hidden sm:inline">
                👈 Lướt ngang để chọn truyện 👉
              </span>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 pt-2 px-2 snap-x snap-mandatory">
              {approvedStories.map((story) => (
                <div
                  key={story.id}
                  className="snap-center shrink-0 w-[265px] sm:w-[320px] md:w-[340px] flex flex-col rounded-[32px] bg-surface border border-ink/10 shadow-pop overflow-hidden group transition-all transform hover:-translate-y-2"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface-2">
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

                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 text-white">
                      <h2 className="font-heading font-extrabold text-lg sm:text-xl leading-snug line-clamp-2 drop-shadow-sm">
                        {story.title}
                      </h2>
                      <p className="text-xs font-semibold text-white/90 mt-1 flex items-center gap-1">
                        <span>✨ {story.pages?.length || 4} trang truyện</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-surface flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playMagic();
                        navigate(`/story/${story.id}?mode=kid`);
                      }}
                      className="w-full min-h-[68px] rounded-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-heading font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-btn-primary transition-all cursor-pointer"
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
        description="Vui lòng xác thực người lớn để rời khỏi Góc Đọc Của Bé."
        maxWidth="sm"
      >
        <div className="space-y-4">
          {pinConfigured && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-2 rounded-2xl border border-ink/10">
              <button
                type="button"
                onClick={() => {
                  setGateType('pin');
                  setGateError(null);
                  setUserAnswer('');
                }}
                className={`py-2 text-xs font-heading font-bold rounded-xl transition-all min-h-[40px] cursor-pointer ${
                  gateType === 'pin' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft'
                }`}
              >
                Mã PIN phụ huynh
              </button>
              <button
                type="button"
                onClick={() => {
                  setGateType('math');
                  setGateError(null);
                  setUserAnswer('');
                }}
                className={`py-2 text-xs font-heading font-bold rounded-xl transition-all min-h-[40px] cursor-pointer ${
                  gateType === 'math' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft'
                }`}
              >
                Phép tính người lớn
              </button>
            </div>
          )}

          {gateType === 'math' || !pinConfigured ? (
            <div className="text-center p-5 bg-peach/20 rounded-2xl border border-peach space-y-1">
              <span className="text-xs font-bold text-ink-soft block">
                Giải phép nhân người lớn để tiếp tục:
              </span>
              <span className="text-3xl font-heading font-black text-ink tracking-wider block">
                {mathA} &times; {mathB} = ?
              </span>
              {!pinConfigured && (
                <span className="text-[11px] text-ink-soft block pt-1">
                  (Mẹo: Ba mẹ có thể đặt mã PIN 4 chữ số riêng tại mục Cài đặt)
                </span>
              )}
            </div>
          ) : (
            <div className="p-4 bg-mint/20 rounded-2xl border border-mint text-xs text-ink leading-relaxed">
              Nhập mã PIN 4 chữ số bí mật do cha mẹ đã thiết lập cho gia đình.
            </div>
          )}

          <Input
            type={gateType === 'pin' && pinConfigured ? 'password' : 'number'}
            inputMode="numeric"
            maxLength={gateType === 'pin' && pinConfigured ? 4 : 4}
            placeholder={gateType === 'pin' && pinConfigured ? '••••' : 'Nhập đáp án...'}
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
