import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Core Auth & User Shell (eager for fast initial paint)
import { UserLayout } from '@/components/layout/UserLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { LibraryPage } from '@/pages/library/LibraryPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { TrustPage } from '@/pages/trust/TrustPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteLoader, RootDocumentMetaLayout } from './RouteShells';

// Guards
import { ProtectedRoute, AdminRoute, GuestRoute } from './guards';

// Lazy-loaded Heavy User Routes (Flipbook, Camera/Canvas, Kid Fullscreen)
const CreateStoryPage = lazy(() =>
  import('@/pages/create/CreateStoryPage').then((m) => ({ default: m.CreateStoryPage }))
);
const StoryReadingPage = lazy(() =>
  import('@/pages/reader/StoryReadingPage').then((m) => ({ default: m.StoryReadingPage }))
);
const SharedStoryPage = lazy(() =>
  import('@/pages/reader/SharedStoryPage').then((m) => ({ default: m.SharedStoryPage }))
);
const KidModePage = lazy(() =>
  import('@/pages/kid/KidModePage').then((m) => ({ default: m.KidModePage }))
);

// Lazy-loaded Admin Layout & Pages (isolates Recharts & Admin bundle from Parent users)
const AdminLayout = lazy(() =>
  import('@/components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminOverviewPage = lazy(() =>
  import('@/pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage }))
);
const ModerationQueuePage = lazy(() =>
  import('@/pages/admin/ModerationQueuePage').then((m) => ({ default: m.ModerationQueuePage }))
);
const SafetyRulesPage = lazy(() =>
  import('@/pages/admin/SafetyRulesPage').then((m) => ({ default: m.SafetyRulesPage }))
);
const SystemPromptsPage = lazy(() =>
  import('@/pages/admin/SystemPromptsPage').then((m) => ({ default: m.SystemPromptsPage }))
);
const CostsQuotasPage = lazy(() =>
  import('@/pages/admin/CostsQuotasPage').then((m) => ({ default: m.CostsQuotasPage }))
);
const UserManagementPage = lazy(() =>
  import('@/pages/admin/UserManagementPage').then((m) => ({ default: m.UserManagementPage }))
);
const ModerationSettingsPage = lazy(() =>
  import('@/pages/admin/ModerationSettingsPage').then((m) => ({ default: m.ModerationSettingsPage }))
);
const AuditLogsPage = lazy(() =>
  import('@/pages/admin/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage }))
);

// Dev-only Styleguide (never shipped or exposed in production routes)
const StyleguidePage = import.meta.env.DEV
  ? lazy(() => import('@/pages/dev/StyleguidePage').then((m) => ({ default: m.StyleguidePage })))
  : null;

function withSuspense(node: React.ReactNode): React.ReactElement {
  return <Suspense fallback={<RouteLoader />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <RootDocumentMetaLayout />,
    children: [
      // Auth Routes
      {
        element: (
          <GuestRoute>
            <AuthLayout />
          </GuestRoute>
        ),
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },

      // Shared Story Route (Public)
      {
        path: '/shared/:token',
        element: withSuspense(<SharedStoryPage />),
      },

      // Dev Styleguide Route (Strictly restricted to local DEV environment)
      ...(import.meta.env.DEV && StyleguidePage
        ? [
            {
              path: '/dev/styleguide',
              element: withSuspense(<StyleguidePage />),
            },
          ]
        : []),

      // User App Protected Routes
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'create', element: withSuspense(<CreateStoryPage />) },
          { path: 'story/:id', element: withSuspense(<StoryReadingPage />) },
          { path: 'library', element: <LibraryPage /> },
          { path: 'kid', element: withSuspense(<KidModePage />) },
          { path: 'kid-mode', element: <Navigate to="/kid" replace /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'trust', element: <TrustPage /> },
        ],
      },

      // Admin App Protected Routes (Lazy-loaded)
      {
        path: '/admin',
        element: (
          <AdminRoute>
            {withSuspense(<AdminLayout />)}
          </AdminRoute>
        ),
        children: [
          { index: true, element: withSuspense(<AdminOverviewPage />) },
          { path: 'overview', element: <Navigate to="/admin" replace /> },
          { path: 'queue', element: withSuspense(<ModerationQueuePage />) },
          { path: 'moderation', element: <Navigate to="/admin/queue" replace /> },
          { path: 'rules', element: withSuspense(<SafetyRulesPage />) },
          { path: 'prompts', element: withSuspense(<SystemPromptsPage />) },
          { path: 'costs', element: withSuspense(<CostsQuotasPage />) },
          { path: 'users', element: withSuspense(<UserManagementPage />) },
          { path: 'settings', element: withSuspense(<ModerationSettingsPage />) },
          { path: 'audit', element: withSuspense(<AuditLogsPage />) },
        ],
      },

      // 404 Catch All
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
