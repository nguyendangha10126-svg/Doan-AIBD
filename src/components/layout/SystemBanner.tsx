import React from 'react';
import { AlertTriangle, DatabaseZap } from 'lucide-react';
import { isMockEnabled, hasValidSupabaseConfig } from '@/lib/supabase';

export const SystemBanner: React.FC = () => {
  if (isMockEnabled) {
    return (
      <aside aria-label="Thông báo hệ thống demo" className="sticky top-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-xs md:text-sm font-heading font-bold shadow-md flex items-center justify-center gap-2 border-b border-amber-600">
        <DatabaseZap className="w-4 h-4 shrink-0 text-amber-950 animate-pulse" />
        <span>
          <strong>DỮ LIỆU DEMO:</strong> Ứng dụng đang chạy với chế độ dữ liệu mẫu cục bộ (<code className="bg-amber-400/80 px-1.5 py-0.5 rounded font-mono text-xs">VITE_USE_MOCK=true</code>). Mọi dữ liệu chỉ lưu trên trình duyệt của bạn.
        </span>
      </aside>
    );
  }

  if (!hasValidSupabaseConfig) {
    return (
      <aside aria-label="Cảnh báo thiếu biến môi trường" className="sticky top-0 z-50 bg-rose-600 text-white px-4 py-2.5 text-xs md:text-sm font-heading font-bold shadow-lg flex items-center justify-center gap-2 border-b border-rose-700">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
        <span>
          <strong>LỖI CẤU HÌNH:</strong> Thiếu biến môi trường Supabase (<code className="bg-rose-700/80 px-1.5 py-0.5 rounded font-mono text-xs">VITE_SUPABASE_URL</code> hoặc <code className="bg-rose-700/80 px-1.5 py-0.5 rounded font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> trong .env). Hãy kết nối Supabase thật hoặc đặt <code className="bg-rose-700/80 px-1.5 py-0.5 rounded font-mono text-xs">VITE_USE_MOCK=true</code> để bật chế độ thử nghiệm.
        </span>
      </aside>
    );
  }

  return null;
};
