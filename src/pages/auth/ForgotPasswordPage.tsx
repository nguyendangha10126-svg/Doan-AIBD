import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const forgotSchema = z.object({
  email: z.string().email(vi.auth.errorInvalidEmail),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    const ok = await requestPasswordReset(data.email);
    setIsLoading(false);
    if (ok) {
      setIsSubmitted(true);
      toast.success('Đã gửi yêu cầu khôi phục mật khẩu!');
    } else {
      toast.error('Không thể gửi email khôi phục lúc này. Vui lòng thử lại sau ít phút.');
    }
  };

  return (
    <div className="bg-surface rounded-card border border-ink/10 shadow-card p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-butter/60 border border-ink/10 flex items-center justify-center text-3xl shadow-xs">
          🔑
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-ink">
          {vi.auth.forgotPasswordTitle}
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {vi.auth.forgotPasswordSubtitle}
        </p>
      </div>

      {isSubmitted ? (
        <div className="text-center space-y-4 py-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-success-bg flex items-center justify-center text-success">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-ink leading-relaxed">
            Liên kết khôi phục mật khẩu đã được gửi qua Supabase Auth tới hộp thư của bạn. Vui lòng kiểm tra hộp thư đến hoặc thư rác.
          </p>
          <Link to="/login" className="inline-block mt-3">
            <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              {vi.auth.backToLogin}
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={vi.auth.emailLabel}
            type="email"
            placeholder={vi.auth.emailPlaceholder}
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            {vi.auth.submitForgot}
          </Button>

          <div className="text-center mt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-ink-soft hover:text-brand-600 transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {vi.auth.backToLogin}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
