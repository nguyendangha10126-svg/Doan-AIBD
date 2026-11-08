import React, { useState } from 'react';
import { 
  Users, 
  Key, 
  Download, 
  Trash2, 
  Plus, 
  Check, 
  ShieldCheck,
  Lock,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';
import { vi } from '@/lib/i18n/vi';
import { Child } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { OtpPinInput } from '@/components/ui/OtpPinInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const { profile, childrenList, addChild, updateChild, deleteChild, updatePin, logout } = useAuthStore();
  const { stories, exportUserDataJson, clearAllUserData } = useStoryStore();

  // Child modal state (Add & Edit)
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childNickname, setChildNickname] = useState('');
  const [childAge, setChildAge] = useState(5);
  const [childEmoji, setChildEmoji] = useState('🥑');
  const [childColor, setChildColor] = useState('#FF8FA3');

  // Delete child confirmation
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);

  // PIN state
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // GDPR delete account modal
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  const emojiOptions = ['🥑', '🐿️', '🐱', '🐰', '🐻', '🦁', '🌟', '🎨', '🚀', '🦕', '🌸', '🦊'];
  const colorOptions = ['#FF8FA3', '#7C6CF0', '#C9F0DD', '#FFD6BA', '#CDE7FF', '#FFF1B8', '#F0607F', '#8B7CF6'];
  const ageOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const handleOpenAddChild = () => {
    setEditingChildId(null);
    setChildNickname('');
    setChildAge(5);
    setChildEmoji('🥑');
    setChildColor('#FF8FA3');
    setIsChildModalOpen(true);
  };

  const handleOpenEditChild = (child: Child) => {
    setEditingChildId(child.id);
    setChildNickname(child.nickname);
    setChildAge(child.age);
    setChildEmoji(child.avatar_emoji);
    setChildColor(child.avatar_color);
    setIsChildModalOpen(true);
  };

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childNickname.trim()) {
      toast.error('Vui lòng nhập biệt danh cho bé');
      return;
    }

    if (editingChildId) {
      await updateChild(editingChildId, {
        nickname: childNickname.trim(),
        age: Number(childAge),
        avatar_color: childColor,
        avatar_emoji: childEmoji,
      });
      toast.success('Đã cập nhật hồ sơ bé yêu!');
    } else {
      await addChild({
        nickname: childNickname.trim(),
        age: Number(childAge),
        avatar_color: childColor,
        avatar_emoji: childEmoji,
      });
      toast.success('Đã thêm hồ sơ bé yêu thành công!');
    }

    setIsChildModalOpen(false);
  };

  const handleDeleteChildConfirmed = async () => {
    if (!childToDelete) return;
    await deleteChild(childToDelete.id);
    toast.success(`Đã xóa hồ sơ bé ${childToDelete.nickname}`);
    setChildToDelete(null);
  };

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(newPin.trim())) {
      toast.error('Mã PIN phải gồm đúng 4 chữ số.');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('Mã PIN xác nhận không trùng khớp.');
      return;
    }
    if (!currentPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu tài khoản để xác thực.');
      return;
    }
    const ok = await updatePin(newPin.trim());
    if (ok) {
      toast.success('Đã cập nhật mã PIN bảo vệ phụ huynh thành công!');
      setIsChangingPin(false);
      setNewPin('');
      setConfirmPin('');
      setCurrentPassword('');
    }
  };

  const handleExportData = () => {
    const dataStr = exportUserDataJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawtostory-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống toàn bộ dữ liệu gia đình dạng JSON!');
  };

  const handleDeleteAccountConfirmed = async () => {
    clearAllUserData();
    await logout();
    toast.success('Đã xóa vĩnh viễn toàn bộ dữ liệu tài khoản');
    setIsDeleteAccountOpen(false);
    window.location.href = '/login';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight">
          {vi.settings.title}
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1">
          {vi.settings.subtitle}
        </p>
      </div>

      {/* 1. Children Profiles Section */}
      <Card variant="white" className="p-6 md:p-8 space-y-6 border border-ink/10 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-ink">
                {vi.settings.childrenSection}
              </h2>
              <p className="text-xs text-ink-soft">
                Quản lý độ tuổi để AI điều chỉnh độ dài câu chữ và bài học phù hợp
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddChild}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {vi.settings.addChildButton}
          </Button>
        </div>

        {/* Children Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {childrenList.map((kid) => {
            const storyCount = stories.filter((s) => s.child_id === kid.id).length;

            return (
              <div
                key={kid.id}
                className="p-4 rounded-2xl bg-surface-2 border border-ink/10 flex items-center justify-between gap-3 shadow-xs hover:border-ink/20 transition-all"
              >
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div
                    className="w-13 h-13 rounded-2xl flex items-center justify-center text-3xl shadow-xs shrink-0"
                    style={{ backgroundColor: kid.avatar_color + '35' }}
                  >
                    {kid.avatar_emoji}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-heading font-extrabold text-base text-ink block truncate">
                      {kid.nickname}
                    </span>
                    <span className="text-xs font-bold text-brand-600 block mt-0.5">
                      {kid.age} tuổi • <strong>{storyCount}</strong> câu chuyện
                    </span>
                    <span className="text-[11px] text-ink-faint block mt-0.5">
                      Hồ sơ đang hoạt động
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditChild(kid)}
                    className="p-2 rounded-xl text-ink-faint hover:text-ink hover:bg-surface transition-colors cursor-pointer"
                    title="Chỉnh sửa hồ sơ bé"
                    aria-label={`Sửa hồ sơ ${kid.nickname}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {childrenList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setChildToDelete(kid)}
                      className="p-2 rounded-xl text-ink-faint hover:text-[#B42343] hover:bg-[#FFE3EA] transition-colors cursor-pointer"
                      title="Xóa hồ sơ bé"
                      aria-label={`Xóa hồ sơ ${kid.nickname}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Parental PIN Protection Section */}
      <Card variant="white" className="p-6 md:p-8 space-y-5 border border-ink/10 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-mint flex items-center justify-center text-ink shrink-0">
            <Key className="w-5 h-5 text-[#166E48]" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-extrabold text-ink">
              {vi.settings.pinSection}
            </h2>
            <p className="text-xs text-ink-soft">
              {vi.settings.pinDesc}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-2 border border-ink/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={profile?.parental_pin_hash ? 'success' : 'warning'} size="sm">
                {profile?.parental_pin_hash ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {profile?.parental_pin_hash ? 'Đã đặt mã PIN' : 'Chưa đặt mã PIN'}
              </Badge>
              <span className="text-xs text-ink-faint">Mã hóa 1 chiều SHA-256</span>
            </div>
            <p className="text-xs text-ink-soft">
              Mã PIN 4 số bảo vệ Chế độ Bé và các thiết lập tài khoản của phụ huynh.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setNewPin('');
              setConfirmPin('');
              setCurrentPassword('');
              setIsChangingPin(true);
            }}
          >
            {profile?.parental_pin_hash ? 'Đổi mã PIN' : 'Thiết lập mã PIN'}
          </Button>
        </div>
      </Card>

      {/* 3. GDPR Privacy & Data Ownership Section */}
      <Card variant="white" className="p-6 md:p-8 space-y-6 border border-ink/10 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky flex items-center justify-center text-[#1F5FA8] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-extrabold text-ink">
              {vi.settings.privacySection}
            </h2>
            <p className="text-xs text-ink-soft">
              Quyền kiểm soát dữ liệu cá nhân theo tiêu chuẩn GDPR & Responsible AI
            </p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-ink/10">
          {/* Export Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <span className="text-sm font-heading font-extrabold text-ink block">
                {vi.settings.exportData}
              </span>
              <p className="text-xs text-ink-soft mt-0.5">
                {vi.settings.exportDataDesc}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportData}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Tải file JSON
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
            <div>
              <span className="text-sm font-heading font-extrabold text-[#B42343] block">
                {vi.settings.deleteAccount}
              </span>
              <p className="text-xs text-ink-soft mt-0.5">
                {vi.settings.deleteAccountDesc}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteAccountOpen(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Xóa tài khoản
            </Button>
          </div>
        </div>
      </Card>

      {/* Add / Edit Child Modal with Age Chip Grid and Live Profile Preview */}
      <Modal
        isOpen={isChildModalOpen}
        onClose={() => setIsChildModalOpen(false)}
        title={editingChildId ? 'Chỉnh sửa hồ sơ bé' : vi.settings.addChildButton}
        description="Chọn độ tuổi và nhân vật đại diện để AI cá nhân hóa trải nghiệm đọc truyện."
      >
        <form onSubmit={handleSaveChild} className="space-y-5 pt-2">
          
          {/* Live Profile Preview Card */}
          <div className="p-4 rounded-2xl bg-surface-2 border border-ink/10 flex items-center gap-4 shadow-xs">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xs shrink-0 transition-all"
              style={{ backgroundColor: childColor + '35' }}
            >
              {childEmoji}
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-brand-600 uppercase tracking-wider block">
                Thẻ xem trước
              </span>
              <h4 className="font-heading font-extrabold text-base text-ink">
                {childNickname.trim() || 'Tên của bé'}
              </h4>
              <span className="text-xs text-ink-soft font-bold block mt-0.5">
                Độ tuổi: {childAge} tuổi • Sẵn sàng dệt truyện
              </span>
            </div>
          </div>

          {/* Nickname Input */}
          <Input
            label={vi.settings.childNicknameLabel}
            placeholder={vi.settings.childNicknamePlaceholder}
            value={childNickname}
            onChange={(e) => setChildNickname(e.target.value)}
            required
            autoFocus
          />

          {/* Age Chip Grid 2-12 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-heading font-extrabold text-ink">
              {vi.settings.childAgeLabel}: <span className="text-brand-600 font-bold">{childAge} tuổi</span>
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
              {ageOptions.map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setChildAge(age)}
                  className={`h-10 rounded-xl text-xs font-heading font-bold transition-all border cursor-pointer flex items-center justify-center ${
                    childAge === age
                      ? 'bg-brand-600 text-white border-brand-600 shadow-btn-primary scale-105'
                      : 'bg-surface text-ink border-ink/15 hover:bg-surface-2'
                  }`}
                  aria-label={`${age} tuổi`}
                >
                  {age}t
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink-faint pt-0.5">
              AI sẽ dùng độ tuổi để chọn lọc kho từ vựng và bài học đạo đức tương ứng.
            </p>
          </div>

          {/* Emoji Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-heading font-extrabold text-ink">
              Biểu tượng đại diện (Avatar)
            </label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setChildEmoji(em)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer border ${
                    childEmoji === em
                      ? 'bg-surface border-brand-600 shadow-card scale-110 ring-2 ring-brand-100'
                      : 'bg-surface-2 border-ink/10 hover:bg-surface'
                  }`}
                  aria-label={`Chọn icon ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-heading font-extrabold text-ink">
              {vi.settings.childColorLabel}
            </label>
            <div className="flex flex-wrap gap-2.5">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChildColor(c)}
                  className={`w-9 h-9 rounded-full transition-all border-2 cursor-pointer ${
                    childColor === c ? 'scale-115 border-ink shadow-card' : 'border-surface shadow-xs'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Màu ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex justify-end gap-2 border-t border-ink/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsChildModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" rightIcon={<Check className="w-4 h-4" />}>
              {editingChildId ? 'Lưu thay đổi' : vi.settings.saveChild}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Child Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(childToDelete)}
        onClose={() => setChildToDelete(null)}
        onConfirm={handleDeleteChildConfirmed}
        title={`Xác nhận xóa hồ sơ bé ${childToDelete?.nickname}?`}
        description="Toàn bộ lịch sử liên quan đến hồ sơ này sẽ được giải phóng. Bạn có chắc chắn muốn xóa không?"
        confirmText="Xóa hồ sơ"
        cancelText="Giữ lại"
      />

      {/* Change PIN Modal */}
      <Modal
        isOpen={isChangingPin}
        onClose={() => setIsChangingPin(false)}
        title="Thiết lập / Đổi mã PIN phụ huynh"
        description="Mã PIN 4 số bảo vệ các cài đặt tài khoản và khóa chế độ an toàn cho bé."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-heading font-bold text-ink mb-1.5">
              Mật khẩu tài khoản (để xác thực)
            </label>
            <Input
              type="password"
              placeholder="Nhập mật khẩu tài khoản"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-heading font-bold text-ink mb-1.5">
              Mã PIN 4 số mới
            </label>
            <OtpPinInput
              value={newPin}
              onChange={setNewPin}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-heading font-bold text-ink mb-1.5">
              Xác nhận mã PIN mới
            </label>
            <OtpPinInput
              value={confirmPin}
              onChange={setConfirmPin}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-ink/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsChangingPin(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={handleSavePin}
              disabled={newPin.length !== 4 || confirmPin.length !== 4 || !currentPassword.trim()}
            >
              Lưu mã PIN
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Confirm Dialog requiring user to type "XOA" */}
      <ConfirmDialog
        isOpen={isDeleteAccountOpen}
        onClose={() => setIsDeleteAccountOpen(false)}
        onConfirm={handleDeleteAccountConfirmed}
        title="Xóa vĩnh viễn toàn bộ tài khoản?"
        description="Thao tác này sẽ xóa vĩnh viễn toàn bộ lịch sử tranh vẽ, câu chuyện và nhật ký của gia đình. Bạn sẽ không thể khôi phục lại bất kỳ dữ liệu nào."
        confirmWord="XOA"
        confirmText="Xác nhận xóa tài khoản"
        cancelText="Hủy bỏ"
      />
    </div>
  );
};
