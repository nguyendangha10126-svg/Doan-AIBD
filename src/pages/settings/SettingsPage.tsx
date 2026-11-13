import React, { useState, useEffect } from 'react';
import {
  Users,
  Key,
  Download,
  Trash2,
  Plus,
  Check,
  ShieldCheck,
  Lock,
  Edit2,
  UserCircle,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';
import { supabase, isDemoMode } from '@/lib/supabase';
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
  const {
    profile,
    childrenList,
    addChild,
    updateChild,
    deleteChild,
    updateProfileName,
    updatePassword,
    updatePin,
    logout,
  } = useAuthStore();
  const { stories, exportUserDataJson, clearAllUserData } = useStoryStore();

  // Parent Account Profile state
  const [parentName, setParentName] = useState(profile?.full_name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Change Password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [confirmAccountPassword, setConfirmAccountPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setParentName(profile.full_name);
    }
  }, [profile?.full_name]);

  // Child modal state (Add & Edit)
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childNickname, setChildNickname] = useState('');
  const [childAge, setChildAge] = useState(5);
  const [childEmoji, setChildEmoji] = useState('🥑');
  const [childColor, setChildColor] = useState('#FF8FA3');
  const [isSavingChild, setIsSavingChild] = useState(false);

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

  const handleSaveParentName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim()) {
      toast.error('Họ và tên không được để trống.');
      return;
    }
    setIsSavingName(true);
    const ok = await updateProfileName(parentName.trim());
    setIsSavingName(false);
    if (ok) {
      toast.success('Đã cập nhật tên hiển thị của phụ huynh!');
    } else {
      toast.error(useAuthStore.getState().error || 'Không thể cập nhật tên hiển thị.');
    }
  };

  const handleSaveAccountPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccountPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newAccountPassword !== confirmAccountPassword) {
      toast.error('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    setIsSavingPassword(true);
    const ok = await updatePassword(newAccountPassword);
    setIsSavingPassword(false);
    if (ok) {
      toast.success('Đã cập nhật mật khẩu tài khoản thành công!');
      setIsPasswordModalOpen(false);
      setNewAccountPassword('');
      setConfirmAccountPassword('');
    } else {
      toast.error(useAuthStore.getState().error || 'Không thể đổi mật khẩu lúc này.');
    }
  };

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

    setIsSavingChild(true);
    if (editingChildId) {
      const ok = await updateChild(editingChildId, {
        nickname: childNickname.trim(),
        age: Number(childAge),
        avatar_color: childColor,
        avatar_emoji: childEmoji,
      });
      setIsSavingChild(false);
      if (ok) {
        toast.success('Đã cập nhật hồ sơ bé yêu!');
        setIsChildModalOpen(false);
      } else {
        toast.error(useAuthStore.getState().error || 'Không thể cập nhật hồ sơ bé.');
      }
    } else {
      const created = await addChild({
        nickname: childNickname.trim(),
        age: Number(childAge),
        avatar_color: childColor,
        avatar_emoji: childEmoji,
      });
      setIsSavingChild(false);
      if (created) {
        toast.success(`Đã thêm hồ sơ bé ${created.nickname} thành công!`);
        setIsChildModalOpen(false);
      } else {
        toast.error(useAuthStore.getState().error || 'Không thể thêm hồ sơ bé.');
      }
    }
  };

  const handleDeleteChildConfirmed = async () => {
    if (!childToDelete) return;
    const targetName = childToDelete.nickname;
    const ok = await deleteChild(childToDelete.id);
    if (ok) {
      toast.success(`Đã xóa hồ sơ bé ${targetName} và toàn bộ tranh truyện liên quan`);
      setChildToDelete(null);
    } else {
      toast.error(useAuthStore.getState().error || 'Không thể xóa hồ sơ bé lúc này.');
    }
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
    if (!isDemoMode && profile?.email) {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      });
      if (verifyErr) {
        toast.error('Mật khẩu tài khoản không chính xác.');
        return;
      }
    }
    const ok = await updatePin(newPin.trim());
    if (ok) {
      toast.success('Đã cập nhật mã PIN bảo vệ phụ huynh thành công!');
      setIsChangingPin(false);
      setNewPin('');
      setConfirmPin('');
      setCurrentPassword('');
    } else {
      toast.error(useAuthStore.getState().error || 'Không thể cập nhật mã PIN.');
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
    // Cascade delete all children (which cleans up Storage drawings, stories, badges & reading events)
    for (const kid of [...childrenList]) {
      await deleteChild(kid.id);
    }
    clearAllUserData();
    await logout();
    toast.success('Đã xóa vĩnh viễn toàn bộ dữ liệu gia đình và đăng xuất');
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

      {/* 1. Parent Account Profile Section */}
      <Card variant="white" className="p-6 md:p-8 space-y-6 border border-ink/10 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lavender flex items-center justify-center text-magic-600 shrink-0">
              <UserCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-ink">
                Thông tin tài khoản Phụ huynh
              </h2>
              <p className="text-xs text-ink-soft">
                Quản lý tên hiển thị, email đăng nhập và mật khẩu bảo mật tài khoản gia đình
              </p>
            </div>
          </div>

          <Badge variant="mint" size="sm">
            Hạn mức: {profile?.daily_quota ?? 5} truyện/ngày
          </Badge>
        </div>

        <form onSubmit={handleSaveParentName} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <Input
              label="Tên hiển thị của phụ huynh"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Ví dụ: Mẹ Thu Hà"
              required
            />
          </div>

          <div className="md:col-span-4">
            <Input
              label="Email tài khoản"
              value={profile?.email || 'Đã xác thực qua Supabase'}
              disabled
              leftIcon={<Mail className="w-4 h-4 text-ink-faint" />}
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSavingName}
              disabled={parentName.trim() === (profile?.full_name || '')}
              className="w-full"
            >
              Lưu tên
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-ink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-heading font-bold text-ink block">
              Mật khẩu đăng nhập
            </span>
            <span className="text-xs text-ink-soft">
              Khuyến nghị đặt mật khẩu tối thiểu 6 ký tự bao gồm chữ và số.
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setNewAccountPassword('');
              setConfirmAccountPassword('');
              setIsPasswordModalOpen(true);
            }}
            leftIcon={<Lock className="w-3.5 h-3.5" />}
          >
            Đổi mật khẩu
          </Button>
        </div>
      </Card>

      {/* 2. Children Profiles Section */}
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
                Chỉ lưu Biệt danh & Độ tuổi (Data Minimization) để AI điều chỉnh ngôn từ phù hợp
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

        {/* Children Cards Grid or Clean Empty State */}
        {childrenList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-2 border border-dashed border-ink/20 text-center space-y-3">
            <div className="text-3xl">👶</div>
            <div className="space-y-1">
              <p className="text-sm font-heading font-extrabold text-ink">
                Gia đình chưa thêm hồ sơ bé nào
              </p>
              <p className="text-xs text-ink-soft max-w-md mx-auto">
                Hãy nhấn &ldquo;{vi.settings.addChildButton}&rdquo; để tạo không gian sáng tác riêng cho từng bé trong gia đình.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenAddChild}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Thêm bé đầu tiên
            </Button>
          </div>
        ) : (
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
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xs shrink-0"
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
                      className="p-2 rounded-xl text-ink-faint hover:text-ink hover:bg-surface transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Chỉnh sửa hồ sơ bé"
                      aria-label={`Sửa hồ sơ ${kid.nickname}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setChildToDelete(kid)}
                      className="p-2 rounded-xl text-ink-faint hover:text-danger-text hover:bg-danger-bg transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Xóa hồ sơ bé"
                      aria-label={`Xóa hồ sơ ${kid.nickname}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 3. Parental PIN Protection Section */}
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
              <span className="text-xs text-ink-faint">Băm một chiều an toàn</span>
            </div>
            <p className="text-xs text-ink-soft">
              Mã PIN 4 số bảo vệ Cổng phụ huynh trong Chế độ Bé (mặc định ban đầu: <strong>1234</strong>).
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

      {/* 4. GDPR Privacy & Data Ownership Section */}
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

          {/* Delete Family Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
            <div>
              <span className="text-sm font-heading font-extrabold text-danger-text block">
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
              Xóa dữ liệu & Đăng xuất
            </Button>
          </div>
        </div>
      </Card>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Đổi mật khẩu tài khoản"
        description="Nhập mật khẩu mới cho tài khoản phụ huynh của bạn."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveAccountPassword} className="space-y-4 pt-2">
          <Input
            label="Mật khẩu mới"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={newAccountPassword}
            onChange={(e) => setNewAccountPassword(e.target.value)}
            required
          />
          <Input
            label="Nhập lại mật khẩu mới"
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmAccountPassword}
            onChange={(e) => setConfirmAccountPassword(e.target.value)}
            required
          />
          <div className="pt-3 flex justify-end gap-2 border-t border-ink/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsPasswordModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSavingPassword}>
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Child Modal */}
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
                    childColor === c ? 'scale-110 border-ink shadow-card' : 'border-surface shadow-xs'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Màu ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-ink/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsChildModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSavingChild}
              rightIcon={<Check className="w-4 h-4" />}
            >
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
        description="Toàn bộ tranh vẽ trên đám mây, các trang truyện và huy hiệu gắn với hồ sơ này sẽ được xóa sạch vĩnh viễn. Bạn có chắc chắn muốn xóa không?"
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

      {/* Delete Family Data Confirm Dialog requiring user to type "XOA" */}
      <ConfirmDialog
        isOpen={isDeleteAccountOpen}
        onClose={() => setIsDeleteAccountOpen(false)}
        onConfirm={handleDeleteAccountConfirmed}
        title="Xóa vĩnh viễn toàn bộ dữ liệu gia đình?"
        description="Thao tác này sẽ xóa sạch toàn bộ hồ sơ các bé, ảnh tranh vẽ trên Storage, các cuốn truyện tranh và lịch sử nghe đọc trên máy chủ. Bạn sẽ không thể khôi phục lại."
        confirmWord="XOA"
        confirmText="Xác nhận xóa vĩnh viễn"
        cancelText="Hủy bỏ"
      />
    </div>
  );
};
