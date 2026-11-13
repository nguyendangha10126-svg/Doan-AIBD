import React from 'react';
import { Navigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const AuthInitializingScreen: React.FC = () => (
  <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-card animate-pulse mb-4">
      <Sparkles className="w-7 h-7" />
    </div>
    <p className="text-sm font-heading font-bold text-ink-soft">
      Đang đồng bộ không gian cổ tích...
    </p>
  </div>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <AuthInitializingScreen />;
  }

  if (!profile || profile.is_locked) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <AuthInitializingScreen />;
  }

  if (!profile || profile.is_locked) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <AuthInitializingScreen />;
  }

  if (profile && !profile.is_locked) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return <>{children}</>;
};
