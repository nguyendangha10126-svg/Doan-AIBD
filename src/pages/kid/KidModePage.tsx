import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Lock, Check } from 'lucide-react';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export const KidModePage: React.FC = () => {
  const navigate = useNavigate();
  const { stories } = useStoryStore();
  const { verifyPin } = useAuthStore();

  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gateType, setGateType] = useState<'math' | 'pin'>('math');
  const [mathA] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [mathB] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [userAnswer, setUserAnswer] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);

  // Kid mode only shows approved stories
  const approvedStories = stories.filter((s) =>
    ['auto_approved', 'approved'].includes(s.status)
  );

  const handleVerifyGate = () => {
    setGateError(null);
    if (gateType === 'math') {
      const correct = mathA * mathB;
      if (parseInt(userAnswer.trim(), 10) === correct) {
        setIsGateOpen(false);
        navigate('/');
      } else {
        setGateError(vi.kidMode.wrongAnswer);
      }
    } else {
      if (verifyPin(userAnswer.trim())) {
        setIsGateOpen(false);
        navigate('/');
      } else {
        setGateError('Mã PIN chưa đúng. Vui lòng thử lại!');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Parental Exit Gate */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-3xl border-2 border-peach/50 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-2xl shadow-soft">
            🧸
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-black text-main leading-tight">
              {vi.kidMode.title}
            </h1>
            <p className="text-xs text-main-muted">
              {vi.kidMode.subtitle}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setUserAnswer('');
            setGateError(null);
            setIsGateOpen(true);
          }}
          leftIcon={<Lock className="w-4 h-4 text-amber-500" />}
        >
          {vi.kidMode.exitKidMode}
        </Button>
      </div>

      {/* Kid-Friendly Stories Grid */}
      {approvedStories.length === 0 ? (
        <Card variant="white" className="p-12 text-center space-y-4">
          <div className="text-6xl">🎨</div>
          <h2 className="text-xl font-heading font-bold text-main">
            {vi.kidMode.emptyKidLibrary}
          </h2>
          <Button
            variant="primary"
            onClick={() => {
              setIsGateOpen(true);
            }}
          >
            Quay lại nhờ cha mẹ tạo truyện
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedStories.map((story) => (
            <Card
              key={story.id}
              variant="white"
              isInteractive={true}
              onClick={() => navigate(`/story/${story.id}`)}
              className="p-5 border-3 border-peach/50 hover:border-primary group flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Large Picture Thumbnail */}
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-cream-200 border-2 border-peach/40 shadow-soft group-hover:scale-102 transition-transform">
                  {story.drawing?.image_path ? (
                    <img
                      src={story.drawing.image_path}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      📖
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-heading font-black text-main group-hover:text-primary transition-colors line-clamp-1">
                  {story.title}
                </h2>
              </div>

              <div className="mt-4 pt-3 border-t border-peach/30 flex items-center justify-between">
                <span className="text-xs font-bold text-primary">
                  {story.pages?.length || 4} trang rực rỡ
                </span>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<BookOpen className="w-4 h-4" />}
                  className="rounded-2xl"
                >
                  Mở sách đọc ✨
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Parental Gate Modal */}
      <Modal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        title={vi.kidMode.parentalGateTitle}
        description={vi.kidMode.parentalGateSubtitle}
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          {/* Gate Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-cream-200 rounded-2xl">
            <button
              onClick={() => {
                setGateType('math');
                setGateError(null);
              }}
              className={`py-1.5 text-xs font-heading font-bold rounded-xl transition-all min-h-[40px] ${
                gateType === 'math' ? 'bg-white text-main shadow-soft' : 'text-main-muted'
              }`}
            >
              Phép tính bảo vệ
            </button>
            <button
              onClick={() => {
                setGateType('pin');
                setGateError(null);
              }}
              className={`py-1.5 text-xs font-heading font-bold rounded-xl transition-all min-h-[40px] ${
                gateType === 'pin' ? 'bg-white text-main shadow-soft' : 'text-main-muted'
              }`}
            >
              Mã PIN phụ huynh
            </button>
          </div>

          {gateType === 'math' ? (
            <div className="text-center p-4 bg-peach/20 rounded-2xl border border-peach">
              <span className="text-xs font-bold text-main-muted block mb-1">
                {vi.kidMode.mathQuestion}
              </span>
              <span className="text-2xl font-heading font-black text-main">
                {mathA} &times; {mathB} = ?
              </span>
            </div>
          ) : (
            <div className="p-3 bg-mint/20 rounded-2xl border border-mint text-xs text-emerald-900">
              Nhập mã PIN 4 chữ số (mặc định: <strong>1234</strong>)
            </div>
          )}

          <Input
            type={gateType === 'pin' ? 'password' : 'number'}
            placeholder={vi.kidMode.answerPlaceholder}
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
              {vi.kidMode.confirmExit}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
