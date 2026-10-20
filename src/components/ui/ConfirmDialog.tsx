import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmWord?: string; // e.g. "XOA"
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  confirmWord,
  variant = 'danger',
  isLoading = false,
}) => {
  const [typedWord, setTypedWord] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedWord('');
    }
  }, [isOpen]);

  const canConfirm = !confirmWord || typedWord.trim().toUpperCase() === confirmWord.toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="sm"
    >
      <div className="space-y-4 pt-2">
        {confirmWord && (
          <div className="space-y-1.5 p-3 rounded-2xl bg-brand-100/40 border border-brand-400/30">
            <p className="text-xs text-ink-soft">
              Để xác nhận hành động này, vui lòng gõ chính xác từ: <strong className="font-mono text-brand-700 font-bold">{confirmWord}</strong>
            </p>
            <Input
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value)}
              placeholder={`Gõ "${confirmWord}" để xác nhận`}
              autoFocus
            />
          </div>
        )}

        <div className="pt-4 flex justify-end gap-2 border-t border-ink/10">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || isLoading}
            isLoading={isLoading}
            disabledTooltip={confirmWord && !canConfirm ? `Hãy gõ "${confirmWord}" để tiếp tục` : undefined}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
