import React, { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export const SafetyRulesPage: React.FC = () => {
  const { safetyRules, toggleSafetyRule, addSafetyRule, deleteSafetyRule } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<number>(4);
  const [action, setAction] = useState<'block' | 'flag' | 'rewrite'>('block');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !description.trim()) {
      toast.error('Vui lòng điền đầy đủ danh mục và mô tả');
      return;
    }

    addSafetyRule({
      category: category.trim(),
      description: description.trim(),
      severity,
      action,
      is_active: true,
    });

    toast.success('Đã tạo quy tắc an toàn mới thành công!');
    setIsAddModalOpen(false);
    setCategory('');
    setDescription('');
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
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-main">
            {vi.admin.rules.title}
          </h1>
          <p className="text-xs sm:text-sm text-main-muted mt-1">
            Các quy tắc sẽ được nạp tức thì vào prompt AI và kiểm tra ở Lớp 1 và Lớp 3
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
      <Card variant="white" className="p-0 border-2 border-peach/50 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-cream-200 border-b border-peach/40 text-main font-heading font-bold">
              <tr>
                <th className="p-4">{vi.admin.rules.category}</th>
                <th className="p-4">{vi.admin.rules.description}</th>
                <th className="p-4 text-center">{vi.admin.rules.severity}</th>
                <th className="p-4 text-center">{vi.admin.rules.action}</th>
                <th className="p-4 text-center">{vi.admin.rules.status}</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach/30">
              {safetyRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-cream-100/60 transition-colors">
                  <td className="p-4 font-heading font-bold text-main whitespace-nowrap">
                    {rule.category}
                  </td>
                  <td className="p-4 text-main-muted max-w-xs md:max-w-md">
                    {rule.description}
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-heading font-black text-xs px-2.5 py-1 rounded-full bg-cream-300 border border-peach/50">
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
                      onClick={() => {
                        toggleSafetyRule(rule.id);
                        toast.success(vi.admin.rules.toggleSuccess);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        rule.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                      aria-label="Bật tắt quy tắc"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rule.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        deleteSafetyRule(rule.id);
                        toast.info('Đã xóa quy tắc.');
                      }}
                      className="p-2 text-main-muted hover:text-rose-500 transition-colors"
                      title="Xóa quy tắc"
                      aria-label="Xóa quy tắc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Rule Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={vi.admin.rules.addRule}
        description="Thêm tiêu chuẩn kiểm duyệt nội dung mới cho nền tảng"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-heading font-bold text-main mb-1.5">
                {vi.admin.rules.severity} (1-5)
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full min-h-[44px] rounded-2xl border-2 border-peach/50 bg-white px-3 text-xs md:text-sm font-heading font-bold"
              >
                <option value={1}>1 - Rất nhẹ (Gợi ý)</option>
                <option value={2}>2 - Nhẹ</option>
                <option value={3}>3 - Trung bình</option>
                <option value={4}>4 - Nghiêm trọng (Flag/Rewrite)</option>
                <option value={5}>5 - Cực kỳ nguy hại (Block)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-heading font-bold text-main mb-1.5">
                {vi.admin.rules.action}
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as 'block' | 'flag' | 'rewrite')}
                className="w-full min-h-[44px] rounded-2xl border-2 border-peach/50 bg-white px-3 text-xs md:text-sm font-heading font-bold"
              >
                <option value="block">BLOCK (Chặn ngay lập tức)</option>
                <option value="flag">FLAG (Gắn cờ chờ duyệt)</option>
                <option value="rewrite">REWRITE (Yêu cầu viết lại tích cực)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-peach/30">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" rightIcon={<Check className="w-4 h-4" />}>
              Tạo quy tắc
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
