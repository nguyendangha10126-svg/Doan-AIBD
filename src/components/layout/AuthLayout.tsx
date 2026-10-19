import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { vi } from '@/lib/i18n/vi';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      {/* Decorative Pastel Background Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-peach/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-lavender/40 blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[250px] h-[250px] rounded-full bg-mint/30 blur-2xl pointer-events-none" />

      {/* Header with Logo */}
      <header className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-soft">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-black text-xl text-main leading-tight block">
              {vi.brand.name}
            </span>
            <span className="text-[11px] font-semibold text-primary block">
              {vi.brand.tagline}
            </span>
          </div>
        </Link>

        <Link
          to="/trust"
          className="flex items-center gap-1.5 text-xs font-heading font-bold text-main-muted hover:text-accent bg-white/80 px-3.5 py-1.5 rounded-full border border-peach/40 shadow-soft transition-colors min-h-[44px]"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">{vi.trust.title}</span>
        </Link>
      </header>

      {/* Main Form Center Box */}
      <main className="relative z-10 flex-1 flex items-center justify-center my-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="relative z-10 text-center text-xs text-main-muted py-4">
        <p>{vi.brand.aiDisclaimer}</p>
        <p className="mt-1 text-[11px]">
          Đồ án môn AI Based Programming &copy; {new Date().getFullYear()} DrawToStory
        </p>
      </footer>
    </div>
  );
};

