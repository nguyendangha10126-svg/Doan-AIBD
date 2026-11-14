import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { UserGuideModal } from './UserGuideModal';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuthStore();
  return (
    <UserGuideModal
      isOpen={isOpen}
      onClose={onClose}
      role={profile?.role || 'user'}
      userId={profile?.id}
    />
  );
};
