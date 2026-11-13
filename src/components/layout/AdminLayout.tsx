import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldAlert,
  Terminal,
  DollarSign,
  Users,
  Sliders,
  History,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export const AdminLayout: React.FC = () => {
  const { profile, logout } = useAuthStore();
  const { kpis, fetchAdminData } = useAdminStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin', end: true, label: vi.admin.tabs.overview, icon: LayoutDashboard },
    { to: '/admin/queue', label: vi.admin.tabs.queue, icon: ClipboardCheck, badge: kpis.pendingQueueCount > 0 ? String(kpis.pendingQueueCount) : undefined },
    { to: '/admin/rules', label: vi.admin.tabs.rules, icon: ShieldAlert },
    { to: '/admin/prompts', label: vi.admin.tabs.prompts, icon: Terminal },
    { to: '/admin/costs', label: vi.admin.tabs.costs, icon: DollarSign },
    { to: '/admin/users', label: vi.admin.tabs.users, icon: Users },
    { to: '/admin/settings', label: vi.admin.tabs.settings, icon: Sliders },
    { to: '/admin/audit', label: vi.admin.tabs.audit, icon: History },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row text-ink selection:bg-brand-100 selection:text-brand-700 overflow-x-hidden">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-surface border-b border-ink/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-heading font-extrabold text-base text-ink">
            DrawToStory <span className="text-brand-600 text-xs font-semibold">Admin</span>
          </span>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-surface-2 text-ink min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-ink/10 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static shadow-pop md:shadow-none',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-5 flex flex-col gap-6">
          {/* Logo & Portal Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white shadow-btn-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-ink leading-tight block">
                {vi.brand.name}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5" role="navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-heading font-bold transition-all min-h-[44px]',
                      isActive
                        ? 'bg-brand-600 text-white shadow-btn-primary'
                        : 'text-ink-soft hover:text-ink hover:bg-surface-2'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="danger" size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-ink/10 flex flex-col gap-2 bg-surface-2">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              AD
            </div>
            <div className="overflow-hidden">
              <span className="block text-xs font-bold text-ink truncate">
                {profile?.full_name || 'Quản trị viên'}
              </span>
              <span className="block text-[10px] text-brand-600 font-semibold truncate">
                Bảo vệ an toàn trẻ em
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-heading font-bold text-ink-soft hover:text-ink px-3 py-2 rounded-xl hover:bg-surface transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 text-brand-600" />
            Về ứng dụng người dùng
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-heading font-bold text-danger px-3 py-2 rounded-xl hover:bg-danger-bg transition-colors min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            {vi.nav.logout}
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Admin Workspace */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
