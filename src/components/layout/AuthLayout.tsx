import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { vi } from '@/lib/i18n/vi';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Subtle Modern Storybook Ambient Accents */}
      <div className="absolute top-[-12%] left-[-6%] w-[380px] h-[380px] rounded-full bg-peach/35 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-12%] right-[-6%] w-[420px] h-[420px] rounded-full bg-lavender/35 blur-3xl pointer-events-none" />
      <div className="absolute top-[38%] right-[12%] w-[240px] h-[240px] rounded-full bg-mint/25 blur-2xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-btn-primary group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl text-ink leading-tight block">
              {vi.brand.name}
            </span>
            <span className="text-[11px] font-bold text-brand-600 block">
              {vi.brand.tagline}
            </span>
          </div>
        </Link>

        <Link
          to="/trust"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-ink-soft hover:text-ink bg-surface px-3.5 py-2 rounded-full border border-ink/10 shadow-xs transition-colors min-h-[44px]"
        >
          <ShieldCheck className="w-4 h-4 text-success" />
          <span className="hidden sm:inline">{vi.trust.title}</span>
          <span className="sm:hidden">An toàn AI</span>
        </Link>
      </header>

      {/* Main Auth Box */}
      <main className="relative z-10 flex-1 flex items-center justify-center my-6 sm:my-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="relative z-10 text-center text-xs text-ink-soft py-3">
        <p>{vi.brand.aiDisclaimer}</p>
        <p className="mt-1 text-[11px] text-ink-faint font-semibold">
          Đồ án môn AI Based Programming &copy; {new Date().getFullYear()} DrawToStory
        </p>
      </footer>
    </div>
  );
};
