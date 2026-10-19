import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, HeartHandshake, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { vi } from '@/lib/i18n/vi';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: vi.onboarding.step1Title,
      desc: vi.onboarding.step1Desc,
      icon: Sparkles,
      emoji: '🎨',
      color: 'bg-peach/40 text-primary-dark',
    },
    {
      title: vi.onboarding.step2Title,
      desc: vi.onboarding.step2Desc,
      icon: HeartHandshake,
      emoji: '🥑',
      color: 'bg-mint/40 text-emerald-800',
    },
    {
      title: vi.onboarding.step3Title,
      desc: vi.onboarding.step3Desc,
      icon: ShieldCheck,
      emoji: '🛡️',
      color: 'bg-sky/40 text-sky-900',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem('has_seen_onboarding', 'true');
      onClose();
    }
  };

  const current = steps[currentStep];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" showCloseButton={true}>
      <div className="py-2 text-center">
        {/* Step Indicator dots */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-primary' : 'w-2.5 bg-peach/60'
              }`}
            />
          ))}
        </div>

        {/* Animated Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div
              className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl shadow-soft ${current.color}`}
            >
              {current.emoji}
            </div>

            <h2 className="text-2xl font-heading font-black text-main">
              {current.title}
            </h2>

            <p className="text-sm md:text-base text-main-muted max-w-md mx-auto leading-relaxed">
              {current.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-peach/30">
          <button
            onClick={() => {
              localStorage.setItem('has_seen_onboarding', 'true');
              onClose();
            }}
            className="text-xs font-heading font-bold text-main-muted hover:text-main px-4 py-2 min-h-[44px]"
          >
            {vi.onboarding.skip}
          </button>

          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            rightIcon={
              currentStep === steps.length - 1 ? (
                <Check className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )
            }
          >
            {currentStep === steps.length - 1 ? vi.onboarding.start : vi.onboarding.next}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

