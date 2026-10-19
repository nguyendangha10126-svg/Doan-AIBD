import React, { useState } from 'react';
import { 
  Users, 
  Key, 
  Download, 
  Trash2, 
  Plus, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export const SettingsPage: React.FC = () => {
  const { profile, childrenList, addChild, updatePin } = useAuthStore();
  const { exportUserDataJson, clearAllUserData } = useStoryStore();

  // Child modal state
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [newAge, setNewAge] = useState(5);
  const [newEmoji, setNewEmoji] = useState('🥑');
  const [newColor, setNewColor] = useState('#FF8FA3');

  // PIN state
  const [pinInput, setPinInput] = useState(profile?.parental_pin_hash || '1234');
  const [isChangingPin, setIsChangingPin] = useState(false);

  // GDPR delete modal
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  const emojiOptions = ['🥑', '🐿️', '🐱', '🐰', '🐻', '🦁', '🌟', '🎨', '🚀', '🦕'];
  const colorOptions = ['#FF8FA3', '#7C6CF0', '#C9F0DD', '#FFD6BA', '#CDE7FF', '#FFF1B8'];

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) {
      toast.error('Vui lòng nhập biệt danh cho bé');
      return;
    }

    await addChild({
      nickname: newNickname.trim(),
      age: Number(newAge),
      avatar_color: newColor,
      avatar_emoji: newEmoji,
    });

    toast.success('Đã thêm hồ sơ bé yêu thành công!');
    setIsAddChildOpen(false);
    setNewNickname('');
  };

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(pinInput.trim())) {
      toast.error(vi.auth.errorPinDigits);
      return;
    }
    const ok = await updatePin(pinInput.trim());
    if (ok) {
      toast.success('Đã cập nhật mã PIN bảo vệ phụ huynh!');
      setIsChangingPin(false);
    }
  };

  const handleExportData = () => {
    const jsonStr = exportUserDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawtostory-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất toàn bộ dữ liệu cá nhân thành công!');
  };

  const handleDeleteAccount = () => {
    clearAllUserData();
    setIsDeleteAccountOpen(false);
    toast.success('Đã xóa dữ liệu gia đình khỏi thiết bị.');
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-main">
          {vi.settings.title}
        </h1>
        <p className="text-xs sm:text-sm text-main-muted mt-1">
          {vi.settings.subtitle}
        </p>
      </div>

      {/* 1. Children Profiles Section */}
      <Card variant="white" className="p-6 md:p-8 space-y-6 border-2 border-peach/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-peach/40 flex items-center justify-center text-primary-dark">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-main">
                {vi.settings.childrenSection}
              </h2>
              <p className="text-xs text-main-muted">
                Dữ liệu tối thiểu: chỉ lưu biệt danh và độ tuổi để gợi ý từ vựng
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddChildOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {vi.settings.addChildButton}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {childrenList.map((kid) => (
            <div
              key={kid.id}
              className="p-4 rounded-2xl bg-cream-100 border border-peach/50 flex items-center gap-4 shadow-soft"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-soft shrink-0"
                style={{ backgroundColor: kid.avatar_color + '30' }}
              >
                {kid.avatar_emoji}
              </div>
              <div>
                <span className="font-heading font-black text-base text-main block">
                  {kid.nickname}
                </span>
                <span className="text-xs text-primary-dark font-bold block mt-0.5">
                  {kid.age} tuổi
                </span>
                <span className="text-[11px] text-main-muted block mt-1">
                  Đã tham gia sáng tác
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. Parental PIN Protection Section */}
      <Card variant="white" className="p-6 md:p-8 space-y-4 border-2 border-peach/50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-mint/50 flex items-center justify-center text-emerald-800">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-main">
              {vi.settings.pinSection}
            </h2>
            <p className="text-xs text-main-muted">
              {vi.settings.pinDesc}
            </p>
          </div>
        </div>

        <div className="max-w-xs space-y-3 pt-2">
          <Input
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            disabled={!isChangingPin}
            helperText="Mã PIN 4 chữ số bí mật của phụ huynh"
          />

          {isChangingPin ? (
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleSavePin}>
                Lưu mã PIN mới
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsChangingPin(false)}>
                Hủy
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangingPin(true)}
            >
              {vi.settings.changePin}
            </Button>
          )}
        </div>
      </Card>

      {/* 3. GDPR Privacy & Data Ownership Section */}
      <Card variant="white" className="p-6 md:p-8 space-y-6 border-2 border-peach/50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-sky/50 flex items-center justify-center text-sky-900">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-main">
              {vi.settings.privacySection}
            </h2>
            <p className="text-xs text-main-muted">
              Quyền kiểm soát dữ liệu cá nhân theo tiêu chuẩn GDPR & Responsible AI
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export JSON */}
          <div className="p-5 rounded-2xl bg-cream-100 border border-peach/40 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-main">
                {vi.settings.exportData}
              </h3>
              <p className="text-xs text-main-muted mt-1 leading-relaxed">
                {vi.settings.exportDataDesc}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Tải file dữ liệu (.JSON)
            </Button>
          </div>

          {/* Delete Account */}
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-rose-800">
                {vi.settings.deleteAccount}
              </h3>
              <p className="text-xs text-rose-600/90 mt-1 leading-relaxed">
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

      {/* Add Child Modal */}
      <Modal
        isOpen={isAddChildOpen}
        onClose={() => setIsAddChildOpen(false)}
        title={vi.settings.addChildButton}
        description="Điền thông tin tối thiểu để AI điều chỉnh độ khó ngôn ngữ cho bé"
      >
        <form onSubmit={handleSaveChild} className="space-y-4 pt-2">
          <Input
            label={vi.settings.childNicknameLabel}
            placeholder={vi.settings.childNicknamePlaceholder}
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-sm font-heading font-bold text-main mb-1.5">
              {vi.settings.childAgeLabel} ({newAge} tuổi)
            </label>
            <input
              type="range"
              min={2}
              max={12}
              value={newAge}
              onChange={(e) => setNewAge(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-main-muted font-bold mt-1">
              <span>2 tuổi</span>
              <span>7 tuổi</span>
              <span>12 tuổi</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-heading font-bold text-main mb-1.5">
              {vi.settings.childEmojiLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setNewEmoji(em)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    newEmoji === em
                      ? 'bg-primary text-white scale-110 shadow-soft'
                      : 'bg-cream-200 hover:bg-peach/40'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-heading font-bold text-main mb-1.5">
              {vi.settings.childColorLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-9 h-9 rounded-full transition-all border-2 ${
                    newColor === c ? 'scale-110 border-main shadow-soft' : 'border-white'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Màu ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-peach/30">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddChildOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" rightIcon={<Check className="w-4 h-4" />}>
              {vi.settings.saveChild}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteAccountOpen}
        onClose={() => setIsDeleteAccountOpen(false)}
        title={vi.settings.deleteAccountConfirm}
        description="Thao tác này sẽ xóa vĩnh viễn toàn bộ lịch sử tranh vẽ, câu chuyện và nhật ký của gia đình. Bạn sẽ không thể khôi phục lại."
        maxWidth="sm"
      >
        <div className="pt-4 flex justify-end gap-2 border-t border-peach/30">
          <Button variant="ghost" size="sm" onClick={() => setIsDeleteAccountOpen(false)}>
            Hủy bỏ
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
            Xác nhận xóa
          </Button>
        </div>
      </Modal>
    </div>
  );
};
