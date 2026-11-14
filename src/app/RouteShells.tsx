import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const RouteLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
    <Sparkles className="w-7 h-7 text-brand-600 animate-spin" />
    <span className="text-xs font-heading font-bold text-ink-soft">
      Đang tải trang...
    </span>
  </div>
);

const ROUTE_TITLES: Array<{ match: (pathname: string) => boolean; title: string }> = [
  { match: (p) => p === '/', title: 'Trang chủ Gia đình | DrawToStory' },
  { match: (p) => p === '/login', title: 'Đăng nhập | DrawToStory' },
  { match: (p) => p === '/register', title: 'Đăng ký tài khoản | DrawToStory' },
  { match: (p) => p === '/forgot-password', title: 'Khôi phục mật khẩu | DrawToStory' },
  { match: (p) => p === '/create', title: 'Sáng tác truyện từ tranh vẽ | DrawToStory' },
  { match: (p) => p.startsWith('/story/'), title: 'Đọc truyện cổ tích | DrawToStory' },
  { match: (p) => p.startsWith('/shared/'), title: 'Ấn bản sách tranh chia sẻ | DrawToStory' },
  { match: (p) => p === '/library', title: 'Tủ sách gia đình | DrawToStory' },
  { match: (p) => p === '/kid', title: 'Góc đọc an toàn của bé | DrawToStory' },
  { match: (p) => p === '/settings', title: 'Cài đặt & Quyền riêng tư | DrawToStory' },
  { match: (p) => p === '/trust', title: 'Cam kết Responsible AI | DrawToStory' },
  { match: (p) => p === '/admin', title: 'Tổng quan Quản trị AI | DrawToStory' },
  { match: (p) => p === '/admin/queue', title: 'Hàng chờ kiểm duyệt | DrawToStory' },
  { match: (p) => p === '/admin/rules', title: 'Bộ quy tắc an toàn | DrawToStory' },
  { match: (p) => p === '/admin/prompts', title: 'System Prompt Studio | DrawToStory' },
  { match: (p) => p === '/admin/costs', title: 'Chi phí & Hạn mức AI | DrawToStory' },
  { match: (p) => p === '/admin/users', title: 'Quản lý người dùng | DrawToStory' },
  { match: (p) => p === '/admin/settings', title: 'Cài đặt kiểm duyệt | DrawToStory' },
  { match: (p) => p === '/admin/audit', title: 'Nhật ký kiểm toán | DrawToStory' },
];

export const RootDocumentMetaLayout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const matched = ROUTE_TITLES.find((item) => item.match(pathname));
    const nextTitle = matched ? matched.title : 'DrawToStory - Thần kỳ hóa nét vẽ tuổi thơ';
    document.title = nextTitle;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', nextTitle);
    }
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', nextTitle);
    }
  }, [pathname]);

  return <Outlet />;
};
