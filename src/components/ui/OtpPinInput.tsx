import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface OtpPinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const OtpPinInput: React.FC<OtpPinInputProps> = ({
  value,
  onChange,
  length = 4,
  disabled = false,
  autoFocus = false,
  className,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').concat(Array(Math.max(0, length - value.length)).fill(''));

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const next = value.slice(0, index) + value.slice(index + 1);
      onChange(next);
      return;
    }
    const lastChar = val.slice(-1);
    const chars = value.split('');
    chars[index] = lastChar;
    const newValue = chars.join('').slice(0, length);
    onChange(newValue);

    if (index < length - 1 && lastChar) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const nextIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[nextIdx]?.focus();
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          value={digits[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            'w-12 h-14 text-center text-xl font-heading font-extrabold rounded-2xl border-2 transition-all',
            'bg-surface text-ink outline-none',
            'focus:border-brand-600 focus:ring-4 focus:ring-brand-100',
            digits[index] ? 'border-brand-400 bg-brand-100/20' : 'border-ink/15',
            disabled && 'opacity-50 cursor-not-allowed bg-ink/5'
          )}
          aria-label={`Chữ số PIN thứ ${index + 1}`}
        />
      ))}
    </div>
  );
};

