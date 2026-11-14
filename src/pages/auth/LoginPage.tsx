import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
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
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    const success = await login(data.email, data.password);
    if (success) {
      const currentProfile = useAuthStore.getState().profile;
      toast.success(vi.auth.loginSuccess);
      if (currentProfile?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      const storeErr = useAuthStore.getState().error;
      setAuthError(storeErr || 'Email hoặc mật khẩu không chính xác.');
      toast.error('Đăng nhập không thành công');
    }
  };

  return (
    <div className="bg-surface rounded-card border border-ink/10 shadow-card p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-surface-2 border border-ink/10 flex items-center justify-center text-3xl shadow-xs">
          🎨
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-ink">
          {vi.auth.loginTitle}
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {vi.auth.loginSubtitle}
        </p>
      </div>

      {authError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-danger-bg border border-danger/25 text-danger text-xs font-bold leading-relaxed">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={vi.auth.emailLabel}
          type="email"
          autoComplete="email"
          placeholder={vi.auth.emailPlaceholder}
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={vi.auth.passwordLabel}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder={vi.auth.passwordPlaceholder}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="p-1.5 text-ink-faint hover:text-ink rounded-lg transition-colors cursor-pointer"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
            <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
            Xác thực bảo mật Supabase Auth
          </span>
          <Link
            to="/forgot-password"
            className="text-xs font-heading font-bold text-accent hover:underline min-h-[36px] flex items-center"
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

      <div className="text-center mt-6">
        <p className="text-xs text-ink-soft">
          {vi.auth.noAccount}{' '}
          <Link to="/register" className="font-heading font-extrabold text-brand-600 hover:underline">
            {vi.auth.submitRegister}
          </Link>
        </p>
      </div>
    </div>
  );
};
