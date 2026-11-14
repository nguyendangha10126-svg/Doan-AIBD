import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Sparkles, 
  BookOpen, 
  Smile, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  ChevronDown,
  LayoutDashboard,
  Plus,
  BookOpenCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { cn, formatChildName } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { UserGuideModal } from '@/features/onboarding/components/UserGuideModal';
import { shouldAutoOpenUserGuide } from '@/features/onboarding/utils/userGuideStorage';

export const UserLayout: React.FC = () => {
  const { profile, logout, childrenList, selectedChildId, setSelectedChildId } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Dropdown states
  const [isChildDropdownOpen, setIsChildDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const childDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-open interactive User Guide upon login (unless user clicked "Tắt & Không hiện lại")
  useEffect(() => {
    if (profile?.id && shouldAutoOpenUserGuide(profile.id)) {
      setIsGuideOpen(true);
    }
  }, [profile?.id]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (childDropdownRef.current && !childDropdownRef.current.contains(e.target as Node)) {
        setIsChildDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Focus Routes: HIDE ALL NAVIGATION CHROME
  const isFocusRoute = 
    location.pathname.startsWith('/create') ||
    location.pathname.startsWith('/story/') ||
    location.pathname.startsWith('/kid') ||
    location.pathname.startsWith('/shared/');

  const selectedChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];

  // Desktop Center Tabs
  const centerTabs = [
    { to: '/', label: 'Trang chủ', icon: Home },
    { to: '/library', label: 'Tủ sách', icon: BookOpen },
    { to: '/trust', label: 'An toàn AI', icon: ShieldCheck },
  ];

  // Mobile Bottom Tab Items
  const mobileTabs = [
    { to: '/', label: 'Trang chủ', icon: Home },
    { to: '/library', label: 'Tủ sách', icon: BookOpen },
    { to: '/create', label: 'Tạo', isFab: true },
    { to: '/trust', label: 'An toàn', icon: ShieldCheck },
    { to: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  if (isFocusRoute) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col overflow-x-hidden">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col selection:bg-brand-100 selection:text-brand-700 overflow-x-hidden">
      {/* Desktop Topbar (Slim & Refined) */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-ink/10 px-4 lg:px-8 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* 1. Left: Brand Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white shadow-btn-primary group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-ink tracking-tight block leading-none">
                DrawToStory
              </span>
              <span className="text-[10px] font-bold text-brand-600 block mt-0.5">
                Nhà xuất bản diệu kỳ
              </span>
            </div>
          </NavLink>

          {/* 2. Center: Sliding Underline Navigation Tabs */}
          <nav 
            className="hidden md:flex items-center gap-1 bg-surface-2 p-1 rounded-full border border-ink/10 shadow-xs"
            role="navigation"
            aria-label="Thanh điều hướng chính"
          >
            {centerTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.to;

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    'relative z-10 flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-heading font-bold rounded-full transition-colors min-h-[40px]',
                    isActive ? 'text-white' : 'text-ink-soft hover:text-ink'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="desktop-active-nav-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      className="absolute inset-0 z-[-1] rounded-full bg-brand-600 shadow-btn-primary"
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* 3. Right: Child Selector, Create CTA, Kid Mode & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Global Child Selector (Popover) */}
            {childrenList.length > 0 && selectedChild && (
              <div ref={childDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsChildDropdownOpen(!isChildDropdownOpen)}
                  className="flex items-center gap-2 bg-surface hover:bg-surface-2 border border-ink/15 rounded-full px-3 py-1.5 shadow-xs transition-all cursor-pointer min-h-[40px]"
                  aria-expanded={isChildDropdownOpen}
                  aria-haspopup="listbox"
                  aria-label="Chọn bé đang xem"
                >
                  <span 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs"
                    style={{ backgroundColor: selectedChild.avatar_color + '40' }}
                  >
                    {selectedChild.avatar_emoji}
                  </span>
                  <span className="hidden sm:inline text-xs font-heading font-bold text-ink">
                    Đang xem: <strong className="text-brand-600">{formatChildName(selectedChild.nickname)}</strong>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-faint" />
                </button>

                {/* Popover Dropdown */}
                <AnimatePresence>
                  {isChildDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-surface border border-ink/10 rounded-2xl shadow-pop p-2 z-50 space-y-1"
                    >
                      <div className="px-3 py-1.5 text-[11px] font-heading font-bold text-ink-faint uppercase tracking-wider">
                        Chọn hồ sơ bé
                      </div>
                      {childrenList.map((kid) => (
                        <button
                          key={kid.id}
                          type="button"
                          onClick={() => {
                            setSelectedChildId(kid.id);
                            setIsChildDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-heading font-bold transition-colors cursor-pointer',
                            kid.id === selectedChild.id
                              ? 'bg-brand-100 text-brand-700'
                              : 'text-ink hover:bg-surface-2'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                              style={{ backgroundColor: kid.avatar_color + '40' }}
                            >
                              {kid.avatar_emoji}
                            </span>
                            <span>{formatChildName(kid.nickname)}</span>
                          </div>
                          <span className="text-[11px] text-ink-faint">{kid.age} tuổi</span>
                        </button>
                      ))}

                      <div className="border-t border-ink/10 pt-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsChildDropdownOpen(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ink-soft hover:text-ink font-heading font-bold rounded-xl hover:bg-surface-2 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm bé mới...</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Create Story CTA Button (Primary Button, not a tab) */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/create')}
              leftIcon={<Plus className="w-4 h-4" />}
              className="hidden sm:inline-flex"
            >
              Tạo truyện
            </Button>

            {/* Kid Mode Button (Secondary Pill) */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/kid')}
              leftIcon={<Smile className="w-4 h-4 text-brand-600" />}
              className="hidden md:inline-flex"
            >
              Chế độ bé
            </Button>

            {/* Account Profile Menu */}
            <div ref={accountDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="w-10 h-10 rounded-full bg-brand-100 border border-brand-400/30 flex items-center justify-center text-brand-700 font-heading font-extrabold text-sm shadow-xs hover:scale-105 transition-all cursor-pointer"
                aria-label="Tài khoản cá nhân"
              >
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'M'}
              </button>

              <AnimatePresence>
                {isAccountDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-surface border border-ink/10 rounded-2xl shadow-pop p-2 z-50 space-y-1"
                  >
                    <div className="px-3 py-2 border-b border-ink/10">
                      <div className="font-heading font-bold text-xs text-ink truncate">
                        {profile?.full_name || 'Phụ huynh'}
                      </div>
                      <div className="text-[11px] text-ink-faint">
                        {profile?.role === 'admin' ? 'Quản trị viên' : 'Gia đình yêu thương'}
                      </div>
                    </div>

                    {profile?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-heading font-bold text-brand-600 hover:bg-brand-100 transition-colors cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Trang Quản trị AI</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        navigate('/kid');
                      }}
                      className="w-full flex md:hidden items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-heading font-bold text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <Smile className="w-4 h-4 text-brand-600" />
                      <span>Chế độ bé</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-heading font-bold text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-ink-soft" />
                      <span>{vi.nav.settings}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        setIsGuideOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-heading font-bold text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <BookOpenCheck className="w-4 h-4 text-brand-600" />
                      <span>Hướng dẫn sử dụng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-heading font-bold text-[#B42343] hover:bg-[#FFE3EA] transition-colors cursor-pointer border-t border-ink/10 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{vi.nav.logout}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-12">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (< 768px) with Safe-Area Inset */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-ink/10 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-pop flex items-center justify-around"
        role="navigation"
        aria-label="Điều hướng di động"
      >
        {mobileTabs.map((item) => {
          if (item.isFab) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative -top-5 flex flex-col items-center group cursor-pointer"
                aria-label="Thần kỳ hóa tạo truyện mới"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#8B7CF6] to-[#F472B6] text-white flex items-center justify-center shadow-btn-magic group-active:scale-95 transition-transform border-4 border-bg">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[10px] font-heading font-extrabold text-brand-600 mt-0.5">
                  {item.label}
                </span>
              </NavLink>
            );
          }

          const Icon = item.icon!;
          const isActive = location.pathname === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center min-w-[48px] min-h-[48px] rounded-2xl transition-all cursor-pointer',
                isActive ? 'text-brand-600 scale-105' : 'text-ink-soft hover:text-ink'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-heading font-bold mt-1', isActive && 'text-brand-600')}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
      {/* Interactive Swipeable User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        role={profile?.role || 'user'}
        userId={profile?.id}
      />
    </div>
  );
};
