import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const forgotSchema = z.object({
  email: z.string().email(vi.auth.errorInvalidEmail),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (_data: ForgotFormData) => {
    setIsLoading(true);
    // Simulate reset link dispatch
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <Card variant="white" className="border-2 border-white shadow-soft-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-butter/50 flex items-center justify-center text-3xl shadow-soft">
          🔑
        </div>
        <h1 className="text-2xl font-heading font-black text-main">
          {vi.auth.forgotPasswordTitle}
        </h1>
        <p className="text-sm text-main-muted mt-1">
          {vi.auth.forgotPasswordSubtitle}
        </p>
      </div>

      {isSubmitted ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-mint flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-main leading-relaxed">
            Liên kết khôi phục đã được gửi đến hòm thư của bạn. Vui lòng kiểm tra hộp thư đến hoặc hòm thư rác.
          </p>
          <Link to="/login" className="inline-block mt-4">
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
              className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-main-muted hover:text-primary transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {vi.auth.backToLogin}
            </Link>
          </div>
        </form>
      )}
    </Card>
  );
};
