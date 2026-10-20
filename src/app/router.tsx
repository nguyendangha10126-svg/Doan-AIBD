import { createBrowserRouter } from 'react-router-dom';

// Layouts
import { UserLayout } from '@/components/layout/UserLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

// User Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CreateStoryPage } from '@/pages/create/CreateStoryPage';
import { StoryReadingPage } from '@/pages/reader/StoryReadingPage';
import { SharedStoryPage } from '@/pages/reader/SharedStoryPage';
import { LibraryPage } from '@/pages/library/LibraryPage';
import { KidModePage } from '@/pages/kid/KidModePage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { TrustPage } from '@/pages/trust/TrustPage';

// Admin Pages
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import { ModerationQueuePage } from '@/pages/admin/ModerationQueuePage';
import { SafetyRulesPage } from '@/pages/admin/SafetyRulesPage';
import { SystemPromptsPage } from '@/pages/admin/SystemPromptsPage';
import { CostsQuotasPage } from '@/pages/admin/CostsQuotasPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { ModerationSettingsPage } from '@/pages/admin/ModerationSettingsPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';

// Common Pages
import { NotFoundPage } from '@/pages/NotFoundPage';
import { StyleguidePage } from '@/pages/dev/StyleguidePage';

// Guards
import { ProtectedRoute, AdminRoute, GuestRoute } from './guards';

export const router = createBrowserRouter([
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
    element: <SharedStoryPage />,
  },

  // Dev Styleguide Route
  {
    path: '/dev/styleguide',
    element: <StyleguidePage />,
  },

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
      { path: 'create', element: <CreateStoryPage /> },
      { path: 'story/:id', element: <StoryReadingPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'kid', element: <KidModePage /> },
      { path: 'kid-mode', element: <KidModePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'trust', element: <TrustPage /> },
    ],
  },

  // Admin App Protected Routes
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminOverviewPage /> },
      { path: 'queue', element: <ModerationQueuePage /> },
      { path: 'rules', element: <SafetyRulesPage /> },
      { path: 'prompts', element: <SystemPromptsPage /> },
      { path: 'costs', element: <CostsQuotasPage /> },
      { path: 'users', element: <UserManagementPage /> },
      { path: 'settings', element: <ModerationSettingsPage /> },
      { path: 'audit', element: <AuditLogsPage /> },
    ],
  },

  // 404 Catch All
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

