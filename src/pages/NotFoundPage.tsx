import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-peach shadow-soft-lg">
        <div className="text-6xl mb-4">🛸</div>
        <h1 className="text-3xl font-heading font-black text-main mb-2">404</h1>
        <h2 className="text-xl font-heading font-bold text-main mb-3">
          Trang này lạc vào xứ sở diệu kỳ rồi!
        </h2>
        <p className="text-sm text-main-muted mb-6 leading-relaxed">
          Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được di chuyển sang một trang sách khác.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/">
            <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
              Về trang chủ
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm font-heading font-bold text-main-muted hover:text-main px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

