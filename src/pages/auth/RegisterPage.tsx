import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const registerSchema = z
  .object({
    fullName: z.string().min(2, vi.auth.errorNameRequired),
    email: z.string().email(vi.auth.errorInvalidEmail),
    password: z.string().min(6, vi.auth.errorShortPassword),
    confirmPassword: z.string().min(6, vi.auth.errorShortPassword),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError(null);
    const result = await registerUser(data.email, data.password, data.fullName);
    if (result.success) {
      if (result.needsConfirmation) {
        setNeedsEmailConfirm(true);
        toast.success('Đã tạo tài khoản! Vui lòng xác nhận email để đăng nhập.');
      } else {
        toast.success(vi.auth.registerSuccess);
        navigate('/');
      }
    } else {
      const storeErr = useAuthStore.getState().error;
      setAuthError(storeErr || 'Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.');
      toast.error('Đăng ký không thành công');
    }
  };

  if (needsEmailConfirm) {
    return (
      <div className="bg-surface rounded-card border border-ink/10 shadow-card p-6 sm:p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-success-bg text-success flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-heading font-extrabold text-ink">
          Kiểm tra hộp thư của bạn
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed">
          Tài khoản gia đình đã được khởi tạo trên Supabase. Vui lòng bấm liên kết xác thực vừa gửi tới email của bạn, sau đó quay lại đăng nhập nhé!
        </p>
        <Link to="/login" className="inline-block pt-2">
          <Button variant="primary" size="md">
            Chuyển tới trang Đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-card border border-ink/10 shadow-card p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-mint/40 border border-ink/10 flex items-center justify-center text-3xl shadow-xs">
          🌟
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-ink">
          {vi.auth.registerTitle}
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {vi.auth.registerSubtitle}
        </p>
      </div>

      {authError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-danger-bg border border-danger/25 text-danger text-xs font-bold leading-relaxed">
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

        <div className="p-3.5 bg-mint/25 rounded-2xl border border-ink/10 flex items-start gap-2.5 text-xs text-ink mt-2">
          <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Cam kết an toàn dữ liệu trẻ em: Chỉ lưu biệt danh và độ tuổi của bé, mã PIN phụ huynh mặc định sau đăng ký là <strong>1234</strong>.
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
        <p className="text-xs text-ink-soft">
          {vi.auth.hasAccount}{' '}
          <Link to="/login" className="font-heading font-extrabold text-brand-600 hover:underline">
            {vi.auth.submitLogin}
          </Link>
        </p>
      </div>
    </div>
  );
};
