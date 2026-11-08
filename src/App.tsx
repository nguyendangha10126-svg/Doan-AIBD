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
  const fetchStories = useStoryStore((state) => state.fetchStories);

  useEffect(() => {
    initialize();
    fetchStories();
  }, [initialize, fetchStories]);

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

