import React, { useState } from 'react';
import { Plus, Trash2, Check, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { SafetyRule } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const SafetyRulesPage: React.FC = () => {
  const { safetyRules, toggleSafetyRule, addSafetyRule, deleteSafetyRule } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<SafetyRule | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<number>(4);
  const [action, setAction] = useState<'block' | 'flag' | 'rewrite'>('block');

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !description.trim()) {
      toast.error('Vui lòng điền đầy đủ danh mục và mô tả');
      return;
    }

    setIsSubmitting(true);
    const ok = await addSafetyRule({
      category: category.trim(),
      description: description.trim(),
      severity,
      action,
      is_active: true,
    });
    setIsSubmitting(false);

    if (ok) {
      toast.success('Đã tạo quy tắc an toàn mới thành công!');
      setIsAddModalOpen(false);
      setCategory('');
      setDescription('');
    } else {
      toast.error('Không thể lưu quy tắc mới vào CSDL.');
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    const ok = await toggleSafetyRule(ruleId);
    if (ok) {
      toast.success(vi.admin.rules.toggleSuccess);
    } else {
      toast.error('Không thể cập nhật trạng thái quy tắc.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    const ok = await deleteSafetyRule(ruleToDelete.id);
    if (ok) {
      toast.info(`Đã xóa quy tắc "${ruleToDelete.category}".`);
      setRuleToDelete(null);
    } else {
      toast.error('Không thể xóa quy tắc này.');
    }
  };

  const getActionBadgeVariant = (act: 'block' | 'flag' | 'rewrite') => {
    switch (act) {
      case 'block':
        return 'danger';
      case 'flag':
        return 'warning';
      case 'rewrite':
        return 'sky';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
            {vi.admin.rules.title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Các quy tắc đang bật sẽ được nạp trực tiếp vào Lớp 1 (Phân tích tranh) và Lớp 3 (Giám định an toàn)
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {vi.admin.rules.addRule}
        </Button>
      </div>

      {/* Rules Table */}
      <Card variant="white" className="p-0 border border-ink/10 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface-2 border-b border-ink/10 text-ink font-heading font-extrabold">
              <tr>
                <th className="p-4">{vi.admin.rules.category}</th>
                <th className="p-4">{vi.admin.rules.description}</th>
                <th className="p-4 text-center">{vi.admin.rules.severity}</th>
                <th className="p-4 text-center">{vi.admin.rules.action}</th>
                <th className="p-4 text-center">{vi.admin.rules.status}</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {safetyRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-ink-soft font-heading font-bold">
                    <ShieldAlert className="w-7 h-7 text-brand-600 mx-auto mb-2" />
                    Chưa có quy tắc an toàn nào. Bấm &ldquo;Thêm quy tắc mới&rdquo; để thiết lập.
                  </td>
                </tr>
              ) : (
                safetyRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-surface-2/60 transition-colors">
                    <td className="p-4 font-heading font-extrabold text-ink whitespace-nowrap">
                      {rule.category}
                    </td>
                    <td className="p-4 text-ink-soft max-w-xs md:max-w-md leading-relaxed">
                      {rule.description}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className="font-heading font-extrabold text-xs px-2.5 py-1 rounded-full bg-surface-2 border border-ink/10 text-ink">
                        Mức {rule.severity}/5
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={getActionBadgeVariant(rule.action)} size="sm">
                        {rule.action.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                          rule.is_active ? 'bg-brand-600' : 'bg-ink/20'
                        }`}
                        aria-label="Bật tắt quy tắc"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                            rule.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setRuleToDelete(rule)}
                        className="p-2 rounded-xl text-ink-faint hover:text-danger-text hover:bg-danger-bg transition-colors cursor-pointer"
                        title="Xóa quy tắc"
                        aria-label="Xóa quy tắc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Rule Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={vi.admin.rules.addRule}
        description="Thêm tiêu chuẩn kiểm duyệt nội dung mới cho nền tảng thiếu nhi"
      >
        <form onSubmit={handleCreateRule} className="space-y-4 pt-2">
          <Input
            label={vi.admin.rules.category}
            placeholder="Ví dụ: Lời lẽ bạo lực, Ngôn từ ghê rợn..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label={vi.admin.rules.description}
            placeholder="Mô tả cụ thể hành vi hoặc chi tiết vi phạm..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading font-extrabold text-ink mb-1.5">
                {vi.admin.rules.severity} (1-5)
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full min-h-[44px] rounded-2xl border border-ink/15 bg-surface px-3 text-xs md:text-sm font-heading font-bold text-ink focus:outline-none focus:border-brand-600"
              >
                <option value={1}>1 - Rất nhẹ (Gợi ý)</option>
                <option value={2}>2 - Nhẹ</option>
                <option value={3}>3 - Trung bình</option>
                <option value={4}>4 - Nghiêm trọng (Flag/Rewrite)</option>
                <option value={5}>5 - Cực kỳ nguy hại (Block)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-heading font-extrabold text-ink mb-1.5">
                {vi.admin.rules.action}
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as 'block' | 'flag' | 'rewrite')}
                className="w-full min-h-[44px] rounded-2xl border border-ink/15 bg-surface px-3 text-xs md:text-sm font-heading font-bold text-ink focus:outline-none focus:border-brand-600"
              >
                <option value="block">BLOCK (Chặn ngay lập tức)</option>
                <option value="flag">FLAG (Gắn cờ chờ duyệt)</option>
                <option value="rewrite">REWRITE (Yêu cầu viết lại tích cực)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-ink/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              rightIcon={<Check className="w-4 h-4" />}
            >
              Tạo quy tắc
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(ruleToDelete)}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Xóa quy tắc "${ruleToDelete?.category}"?`}
        description="Quy tắc này sẽ không còn được áp dụng trong bộ lọc an toàn tự động. Bạn có chắc chắn muốn xóa?"
        confirmText="Xóa quy tắc"
        cancelText="Giữ lại"
      />
    </div>
  );
};
