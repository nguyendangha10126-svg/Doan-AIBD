import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email(vi.auth.errorInvalidEmail),
  password: z.string().min(6, vi.auth.errorShortPassword),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'me@phuhuynh.vn',
      password: 'DrawToStory2026!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    const success = await login(data.email, data.password);
    if (success) {
      toast.success(vi.auth.loginSuccess);
      if (data.email.toLowerCase().includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setAuthError('Email hoặc mật khẩu không chính xác.');
      toast.error('Đăng nhập không thành công');
    }
  };

  const handleQuickDemo = (type: 'user' | 'admin') => {
    if (type === 'admin') {
      setValue('email', 'admin@drawtostory.vn');
      setValue('password', 'AdminSafety2026!');
    } else {
      setValue('email', 'me@phuhuynh.vn');
      setValue('password', 'DrawToStory2026!');
    }
  };

  return (
    <Card variant="white" className="border-2 border-white shadow-soft-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-peach/40 flex items-center justify-center text-3xl shadow-soft">
          🎨
        </div>
        <h1 className="text-2xl font-heading font-black text-main">
          {vi.auth.loginTitle}
        </h1>
        <p className="text-sm text-main-muted mt-1">
          {vi.auth.loginSubtitle}
        </p>
      </div>

      {authError && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={vi.auth.emailLabel}
          type="email"
          placeholder={vi.auth.emailPlaceholder}
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={vi.auth.passwordLabel}
          type="password"
          placeholder={vi.auth.passwordPlaceholder}
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-bold text-accent hover:underline min-h-[44px] flex items-center"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {vi.auth.submitLogin}
        </Button>
      </form>

      {/* Quick Demo Shortcuts for Reviewers */}
      <div className="mt-6 pt-5 border-t border-peach/40">
        <p className="text-xs text-center text-main-muted font-bold uppercase tracking-wider mb-3">
          ⚡ Đăng nhập mẫu nhanh (Dành cho Giám khảo & Thử nghiệm):
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleQuickDemo('user')}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
            className="text-xs"
          >
            Tài khoản Mẹ Hà
          </Button>
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={() => handleQuickDemo('admin')}
            leftIcon={<Shield className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Tài khoản Admin
          </Button>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-xs text-main-muted">
          {vi.auth.noAccount}{' '}
          <Link to="/register" className="font-heading font-black text-primary hover:underline">
            {vi.auth.submitRegister}
          </Link>
        </p>
      </div>
    </Card>
  );
};

