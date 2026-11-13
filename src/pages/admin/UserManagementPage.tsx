import React, { useState } from 'react';
import { Lock, Unlock, Search, Edit3, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import { Profile } from '@/types/database';

export const UserManagementPage: React.FC = () => {
  const { profile: currentAdmin } = useAuthStore();
  const { usersList, toggleUserLock, updateUserQuota } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [customQuotaInput, setCustomQuotaInput] = useState<number>(5);
  const [isSavingQuota, setIsSavingQuota] = useState(false);

  const filteredUsers = usersList.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.id.toLowerCase().includes(q)
    );
  });

  const handleOpenQuotaModal = (user: Profile) => {
    setEditingUser(user);
    setCustomQuotaInput(user.daily_quota);
  };

  const handleSaveCustomQuota = async () => {
    if (!editingUser) return;
    const val = Math.max(0, Math.min(200, Number(customQuotaInput) || 0));
    setIsSavingQuota(true);
    const ok = await updateUserQuota(editingUser.id, val);
    setIsSavingQuota(false);
    if (ok) {
      toast.success(`Đã cập nhật hạn mức ${val} truyện/ngày cho ${editingUser.full_name}`);
      setEditingUser(null);
    } else {
      toast.error('Không thể cập nhật hạn mức người dùng.');
    }
  };

  const handleToggleLock = async (u: Profile) => {
    if (u.id === currentAdmin?.id) {
      toast.error('Không thể tự khóa tài khoản Quản trị viên đang đăng nhập.');
      return;
    }
    const ok = await toggleUserLock(u.id);
    if (ok) {
      toast.info(
        u.is_locked
          ? `Đã mở khóa tài khoản ${u.full_name}`
          : `Đã khóa tài khoản ${u.full_name}`
      );
    } else {
      toast.error('Không thể thay đổi trạng thái khóa tài khoản.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
            {vi.admin.users.title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Quản trị tài khoản phụ huynh, phân quyền bảo vệ và điều chỉnh hạn mức sáng tác riêng
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={vi.admin.users.searchUser}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-surface border border-ink/15 text-xs md:text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-600 min-h-[44px]"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card variant="white" className="p-0 border border-ink/10 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface-2 border-b border-ink/10 text-ink font-heading font-extrabold">
              <tr>
                <th className="p-4">{vi.admin.users.colName}</th>
                <th className="p-4">{vi.admin.users.colRole}</th>
                <th className="p-4 text-center">Hạn mức ngày</th>
                <th className="p-4">{vi.admin.users.colStatus}</th>
                <th className="p-4">Ngày tham gia</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-ink-soft font-heading font-bold">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentAdmin?.id;
                  return (
                    <tr key={u.id} className="hover:bg-surface-2/60 transition-colors">
                      <td className="p-4">
                        <span className="font-heading font-extrabold text-ink block">
                          {u.full_name}
                        </span>
                        <span className="text-[11px] text-ink-soft block mt-0.5">
                          {u.email || `ID: ${u.id.substring(0, 8)}...`}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant={u.role === 'admin' ? 'magic' : 'mint'} size="sm">
                          {u.role === 'admin' ? 'ADMIN' : 'PHỤ HUYNH'}
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-heading font-extrabold text-ink">
                        {u.daily_quota} truyện
                      </td>
                      <td className="p-4">
                        {u.is_locked ? (
                          <Badge variant="danger" size="sm">
                            Đang bị khóa
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Hoạt động
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-ink-soft text-xs whitespace-nowrap font-mono">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenQuotaModal(u)}
                          className="p-2 text-ink-soft hover:text-brand-600 hover:bg-brand-100 rounded-xl transition-colors cursor-pointer"
                          title={vi.admin.users.customQuota}
                          aria-label={vi.admin.users.customQuota}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => handleToggleLock(u)}
                          className={`p-2 rounded-xl transition-colors ${
                            isSelf
                              ? 'opacity-30 cursor-not-allowed text-ink-faint'
                              : u.is_locked
                              ? 'text-success-text hover:bg-success-bg cursor-pointer'
                              : 'text-danger-text hover:bg-danger-bg cursor-pointer'
                          }`}
                          title={
                            isSelf
                              ? 'Tài khoản Admin hiện tại'
                              : u.is_locked
                              ? vi.admin.users.unlockUser
                              : vi.admin.users.lockUser
                          }
                          aria-label={u.is_locked ? vi.admin.users.unlockUser : vi.admin.users.lockUser}
                        >
                          {u.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quota Modal */}
      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="Cấp hạn mức riêng cho tài khoản"
        description={`Điều chỉnh số lượng truyện mỗi ngày dành riêng cho ${editingUser?.full_name}`}
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <Input
            type="number"
            min={0}
            max={200}
            label="Số truyện tối đa mỗi ngày:"
            value={customQuotaInput}
            onChange={(e) => setCustomQuotaInput(Number(e.target.value))}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
            <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSavingQuota}
              onClick={handleSaveCustomQuota}
              rightIcon={<Check className="w-4 h-4" />}
            >
              Lưu hạn mức
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
