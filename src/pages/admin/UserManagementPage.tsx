import React, { useState } from 'react';
import { Lock, Unlock, Search, Edit3, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import { Profile } from '@/types/database';

export const UserManagementPage: React.FC = () => {
  const { usersList, toggleUserLock, updateUserQuota } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [customQuotaInput, setCustomQuotaInput] = useState<number>(5);

  const filteredUsers = usersList.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
  });

  const handleOpenQuotaModal = (user: Profile) => {
    setEditingUser(user);
    setCustomQuotaInput(user.daily_quota);
  };

  const handleSaveCustomQuota = () => {
    if (!editingUser) return;
    updateUserQuota(editingUser.id, customQuotaInput);
    toast.success(`Đã cập nhật hạn mức ${customQuotaInput} truyện/ngày cho ${editingUser.full_name}`);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-main">
            {vi.admin.users.title}
          </h1>
          <p className="text-xs sm:text-sm text-main-muted mt-1">
            Quản trị tài khoản phụ huynh, bảo vệ người dùng và điều chỉnh hạn mức riêng
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-main-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={vi.admin.users.searchUser}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white border border-peach/50 text-xs md:text-sm text-main placeholder:text-main-muted focus:outline-none focus:border-primary min-h-[44px]"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card variant="white" className="p-0 border-2 border-peach/50 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-cream-200 border-b border-peach/40 text-main font-heading font-bold">
              <tr>
                <th className="p-4">{vi.admin.users.colName}</th>
                <th className="p-4">{vi.admin.users.colRole}</th>
                <th className="p-4 text-center">Hạn mức ngày</th>
                <th className="p-4">{vi.admin.users.colStatus}</th>
                <th className="p-4">Ngày tham gia</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach/30">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-main-muted font-bold">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-cream-100/60 transition-colors">
                    <td className="p-4">
                      <span className="font-heading font-bold text-main block">
                        {u.full_name}
                      </span>
                      <span className="text-[11px] text-main-muted font-mono block">
                        ID: {u.id.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={u.role === 'admin' ? 'accent' : 'mint'} size="sm">
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-center font-bold">
                      {u.daily_quota} truyện
                    </td>
                    <td className="p-4">
                      {u.is_locked ? (
                        <Badge variant="danger" size="sm">
                          Đang bị khóa
                        </Badge>
                      ) : (
                        <Badge variant="mint" size="sm">
                          Hoạt động
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-main-muted text-xs whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenQuotaModal(u)}
                        className="p-2 text-main-muted hover:text-accent hover:bg-peach/30 rounded-xl transition-colors"
                        title={vi.admin.users.customQuota}
                        aria-label={vi.admin.users.customQuota}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          toggleUserLock(u.id);
                          toast.info(
                            u.is_locked
                              ? `Đã mở khóa cho ${u.full_name}`
                              : `Đã khóa tài khoản ${u.full_name}`
                          );
                        }}
                        className={`p-2 rounded-xl transition-colors ${
                          u.is_locked
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-rose-500 hover:bg-rose-50'
                        }`}
                        title={u.is_locked ? vi.admin.users.unlockUser : vi.admin.users.lockUser}
                        aria-label={u.is_locked ? vi.admin.users.unlockUser : vi.admin.users.lockUser}
                      >
                        {u.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
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
            min={1}
            max={50}
            label="Số truyện mỗi ngày:"
            value={customQuotaInput}
            onChange={(e) => setCustomQuotaInput(Number(e.target.value))}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-peach/30">
            <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
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
