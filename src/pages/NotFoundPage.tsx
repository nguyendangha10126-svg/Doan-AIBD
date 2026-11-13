import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface rounded-card p-8 border border-ink/10 shadow-card">
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-surface-2 border border-ink/10 flex items-center justify-center text-5xl">
          🛸
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-ink mb-2">404</h1>
        <h2 className="text-xl font-heading font-bold text-ink mb-3">
          Trang này lạc vào xứ sở diệu kỳ rồi!
        </h2>
        <p className="text-sm text-ink-soft mb-6 leading-relaxed">
          Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được chuyển sang một trang sách khác.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/">
            <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
              Về trang chủ
            </Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Quay lại
          </Button>
        </div>
      </div>
    </div>
  );
};
