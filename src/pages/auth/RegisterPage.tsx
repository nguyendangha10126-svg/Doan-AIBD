import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const registerSchema = z.object({
  fullName: z.string().min(2, vi.auth.errorNameRequired),
  email: z.string().email(vi.auth.errorInvalidEmail),
  password: z.string().min(6, vi.auth.errorShortPassword),
  confirmPassword: z.string().min(6, vi.auth.errorShortPassword),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError(null);
    const success = await registerUser(data.email, data.password, data.fullName);
    if (success) {
      toast.success(vi.auth.registerSuccess);
      navigate('/');
    } else {
      setAuthError('Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.');
      toast.error('Đăng ký không thành công');
    }
  };

  return (
    <Card variant="white" className="border-2 border-white shadow-soft-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-mint/40 flex items-center justify-center text-3xl shadow-soft">
          🌟
        </div>
        <h1 className="text-2xl font-heading font-black text-main">
          {vi.auth.registerTitle}
        </h1>
        <p className="text-sm text-main-muted mt-1">
          {vi.auth.registerSubtitle}
        </p>
      </div>

      {authError && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label={vi.auth.fullNameLabel}
          placeholder={vi.auth.fullNamePlaceholder}
          leftIcon={<User className="w-4 h-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

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

        <Input
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="p-3 bg-mint/20 rounded-2xl border border-mint flex items-start gap-2.5 text-xs text-emerald-900 mt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Bảo mật tối đa: Chúng tôi cam kết bảo vệ thông tin cá nhân và an toàn nội dung cho con bạn theo chuẩn Responsible AI.
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {vi.auth.submitRegister}
        </Button>
      </form>

      <div className="text-center mt-6">
        <p className="text-xs text-main-muted">
          {vi.auth.hasAccount}{' '}
          <Link to="/login" className="font-heading font-black text-primary hover:underline">
            {vi.auth.submitLogin}
          </Link>
        </p>
      </div>
    </Card>
  );
};

