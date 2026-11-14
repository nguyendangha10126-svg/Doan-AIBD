import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          // Ignore if already open
        }
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      dialog.returnValue = '';
      if (isOpen) {
        onClose();
      }
    };

    dialog.addEventListener('close', handleNativeClose);

    // Fallback light-dismiss where native <dialog closedby="any"> is not supported yet
    let cleanupFallback: (() => void) | undefined;
    if (
      typeof HTMLDialogElement !== 'undefined' &&
      !('closedBy' in HTMLDialogElement.prototype)
    ) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          dialog.close();
        }
        pressedOutside = false;
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      cleanupFallback = () => {
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      cleanupFallback?.();
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  if (!isOpen) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      aria-label={!title ? 'Hộp thoại' : undefined}
      className={cn(
        'dts-modal w-[calc(100%-1.5rem)] sm:w-full mx-auto my-auto rounded-[28px] shadow-pop overflow-hidden',
        'max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-[28px]',
        maxWidthClasses[maxWidth]
      )}
    >
      {/* Mobile Sheet Drag Indicator */}
      <div className="w-12 h-1.5 bg-ink/15 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

      {/* Fixed Header */}
      {(title || showCloseButton) && (
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3 sm:px-8 sm:pt-7 sm:pb-4 border-b border-ink/5 shrink-0">
          <div className="min-w-0">
            {title && (
              <h2
                id={titleId}
                className="text-xl md:text-2xl font-heading font-extrabold text-ink tracking-tight"
              >
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="text-sm text-ink-soft mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="p-2 rounded-full hover:bg-ink/5 text-ink-faint hover:text-ink transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-1 shrink-0 cursor-pointer"
              aria-label="Đóng hộp thoại"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Scrollable Body (Prevents Desktop & Mobile Viewport Overflow/Clipping) */}
      <div
        className={cn(
          'overflow-y-auto min-h-0 flex-1 px-6 pb-6 sm:px-8 sm:pb-8',
          !(title || showCloseButton) && 'pt-6 sm:pt-8',
          (title || showCloseButton) && 'pt-4'
        )}
      >
        {children}
      </div>
    </dialog>
  );
};
