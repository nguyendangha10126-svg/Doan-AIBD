import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from '@/app/router';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SystemBanner } from '@/components/layout/SystemBanner';

export const App: React.FC = () => {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const profileId = useAuthStore((state) => state.profile?.id);
  const childrenCount = useAuthStore((state) => state.childrenList.length);
  const fetchStories = useStoryStore((state) => state.fetchStories);
  const clearAllUserData = useStoryStore((state) => state.clearAllUserData);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!profileId) {
      clearAllUserData();
      return;
    }
    fetchStories();
  }, [isInitialized, profileId, childrenCount, fetchStories, clearAllUserData]);

  return (
    <ErrorBoundary>
      <SystemBanner />
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            borderRadius: '1rem',
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: 600,
          },
        }}
      />
    </ErrorBoundary>
  );
};
