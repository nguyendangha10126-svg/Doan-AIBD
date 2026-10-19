import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Sparkles, 
  BookOpen, 
  Smile, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon,
  LayoutDashboard
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export const UserLayout: React.FC = () => {
  const { profile, logout, childrenList, selectedChildId, setSelectedChildId } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: vi.nav.home, icon: Home },
    { to: '/library', label: vi.nav.library, icon: BookOpen },
    { to: '/create', label: vi.nav.create, icon: Sparkles, isFab: true },
    { to: '/kid-mode', label: vi.nav.kidMode, icon: Smile },
    { to: '/settings', label: vi.nav.settings, icon: Settings },
  ];

  const selectedChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];

  return (
    <div className="min-h-screen bg-cream flex flex-col selection:bg-primary-light selection:text-primary-dark">
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-peach/40 px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-black text-xl text-main tracking-tight block leading-none">
                {vi.brand.name}
              </span>
              <span className="text-[11px] font-semibold text-primary block mt-0.5">
                {vi.brand.tagline}
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 bg-white/70 p-1.5 rounded-full border border-peach/40 shadow-soft">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-full text-sm font-heading font-bold transition-all min-h-[44px] flex items-center gap-2',
                  isActive ? 'bg-primary text-white shadow-soft' : 'text-main hover:bg-peach/30'
                )
              }
            >
              <Home className="w-4 h-4" />
              {vi.nav.home}
            </NavLink>

            <NavLink
              to="/library"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-full text-sm font-heading font-bold transition-all min-h-[44px] flex items-center gap-2',
                  isActive ? 'bg-primary text-white shadow-soft' : 'text-main hover:bg-peach/30'
                )
              }
            >
              <BookOpen className="w-4 h-4" />
              {vi.nav.library}
            </NavLink>

            <NavLink
              to="/create"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-full text-sm font-heading font-bold transition-all min-h-[44px] flex items-center gap-2',
                  isActive ? 'bg-accent text-white shadow-soft' : 'text-accent hover:bg-accent/15'
                )
              }
            >
              <Sparkles className="w-4 h-4" />
              {vi.nav.create}
            </NavLink>

            <NavLink
              to="/kid-mode"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-full text-sm font-heading font-bold transition-all min-h-[44px] flex items-center gap-2',
                  isActive ? 'bg-primary text-white shadow-soft' : 'text-main hover:bg-peach/30'
                )
              }
            >
              <Smile className="w-4 h-4" />
              {vi.nav.kidMode}
            </NavLink>

            <NavLink
              to="/trust"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-full text-sm font-heading font-bold transition-all min-h-[44px] flex items-center gap-2',
                  isActive ? 'bg-primary text-white shadow-soft' : 'text-main hover:bg-peach/30'
                )
              }
            >
              <ShieldCheck className="w-4 h-4" />
              {vi.nav.trust}
            </NavLink>
          </nav>

          {/* Right Area: Child Switcher & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Child Selector Dropdown/Pill */}
            {childrenList.length > 0 && selectedChild && (
              <div className="hidden sm:flex items-center gap-2 bg-white/80 border border-peach/50 rounded-full px-3 py-1.5 shadow-soft">
                <span className="text-lg">{selectedChild.avatar_emoji}</span>
                <select
                  value={selectedChild.id}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="bg-transparent font-heading font-bold text-xs text-main focus:outline-none cursor-pointer pr-1"
                  aria-label={vi.dashboard.selectChild}
                >
                  {childrenList.map((kid) => (
                    <option key={kid.id} value={kid.id}>
                      {kid.nickname} ({kid.age}t)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Admin Switcher */}
            {profile?.role === 'admin' && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => navigate('/admin')}
                leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
                className="hidden lg:inline-flex"
              >
                {vi.nav.admin}
              </Button>
            )}

            {/* Profile Avatar / Settings */}
            <NavLink
              to="/settings"
              className="w-10 h-10 rounded-full bg-peach flex items-center justify-center text-main border-2 border-white shadow-soft hover:scale-105 transition-transform"
              title={profile?.full_name || vi.nav.profile}
            >
              <UserIcon className="w-5 h-5 text-main" />
            </NavLink>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-main-muted hover:text-rose-500 hover:bg-rose-50 transition-colors hidden sm:flex min-w-[40px] min-h-[40px] items-center justify-center"
              title={vi.nav.logout}
              aria-label={vi.nav.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-peach/40 px-3 py-2 shadow-soft-lg flex items-center justify-around"
        role="navigation"
        aria-label="Điều hướng chính"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          if (item.isFab) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative -top-5 flex flex-col items-center group"
                aria-label={item.label}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center shadow-soft-lg group-active:scale-95 transition-transform border-4 border-cream">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[10px] font-heading font-black text-accent mt-0.5">
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive: active }) =>
                cn(
                  'flex flex-col items-center justify-center min-w-[48px] min-h-[48px] rounded-2xl transition-all',
                  active ? 'text-primary scale-105' : 'text-main-muted hover:text-main'
                )
              }
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-heading font-bold mt-1', isActive && 'text-primary')}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

