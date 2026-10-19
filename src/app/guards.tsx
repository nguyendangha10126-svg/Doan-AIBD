import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuthStore();
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuthStore();
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuthStore();
  if (profile) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

