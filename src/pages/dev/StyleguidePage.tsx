import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Trash2, 
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { OtpPinInput } from '@/components/ui/OtpPinInput';
import { Tabs } from '@/components/ui/Tabs';
import { Chip } from '@/components/ui/Chip';

export const StyleguidePage: React.FC = () => {
  const [pinValue, setPinValue] = useState('5678');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState('all');
  const [activeTab, setActiveTab] = useState('tokens');

  return (
    <div className="min-h-screen bg-bg text-ink p-6 md:p-12 space-y-12 max-w-7xl mx-auto">
      {/* Header */}
      <header className="border-b border-ink/10 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-story">🎨</span>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight">
              Design System & Styleguide
            </h1>
          </div>
          <p className="text-ink-soft mt-1 font-body text-base">
            Phòng trưng bày token "Modern Storybook", kiểm thử tương phản WCAG và toàn bộ component nền.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="mint" size="md">Dev Only</Badge>
          <Badge variant="lavender" size="md">Modern Storybook</Badge>
        </div>
      </header>

      {/* Tabs navigation */}
      <Tabs
        tabs={[
          { id: 'tokens', label: '1. Design Tokens' },
          { id: 'buttons', label: '2. Button Component' },
          { id: 'cards', label: '3. Cards & Frames' },
          { id: 'forms', label: '4. Inputs & Badges' },
          { id: 'states', label: '5. Modals & Skeletons' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        layoutId="styleguide-nav-tabs"
      />

      {/* SECTION 1: DESIGN TOKENS */}
      {(activeTab === 'tokens' || activeTab === 'all') && (
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">1. Bảng Màu & Tokens</h2>
            <p className="text-sm text-ink-soft">Mọi màu chữ trên nền tương ứng đều đạt tỷ lệ tương phản WCAG 2.1 AA.</p>
          </div>

          {/* Color Palettes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Backgrounds */}
            <div className="p-5 rounded-[28px] bg-surface border border-ink/10 space-y-3 shadow-card">
              <h3 className="font-heading font-bold text-sm text-ink">Nền & Bề Mặt</h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-bg border border-ink/15 text-ink flex justify-between items-center">
                  <span>bg #FFF9F0 (Nền ấm kem)</span>
                </div>
                <div className="p-3 rounded-2xl bg-surface border border-ink/15 text-ink flex justify-between items-center shadow-xs">
                  <span>surface #FFFFFF (Bề mặt trắng)</span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-2 border border-ink/15 text-ink flex justify-between items-center">
                  <span>surface-2 #FFF3E6 (Bề mặt phụ)</span>
                </div>
              </div>
            </div>

            {/* Typography Inks */}
            <div className="p-5 rounded-[28px] bg-surface border border-ink/10 space-y-3 shadow-card">
              <h3 className="font-heading font-bold text-sm text-ink">Chữ & Mực (Inks)</h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-bg text-ink border border-ink/15">
                  <div className="font-bold">ink #2E2540 (Chính)</div>
                  <div className="text-[11px] opacity-80">Độ tương phản: 11.2:1 (AAA)</div>
                </div>
                <div className="p-3 rounded-2xl bg-bg text-ink-soft border border-ink/15">
                  <div className="font-bold">ink-soft #5E5370 (Phụ)</div>
                  <div className="text-[11px] opacity-80">Độ tương phản: 5.6:1 (AA)</div>
                </div>
                <div className="p-3 rounded-2xl bg-bg text-ink-faint border border-ink/15">
                  <div className="font-bold">ink-faint #8A7F99 (Chú thích ≥14px)</div>
                  <div className="text-[11px] opacity-80">Độ tương phản: 3.2:1 (Large text)</div>
                </div>
              </div>
            </div>

            {/* Brand & Magic */}
            <div className="p-5 rounded-[28px] bg-surface border border-ink/10 space-y-3 shadow-card">
              <h3 className="font-heading font-bold text-sm text-ink">Thương Hiệu & Magic (AI)</h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-brand-600 text-white font-bold flex justify-between">
                  <span>brand-600 #D13A5E</span>
                  <span>Chữ trắng 4.7:1</span>
                </div>
                <div className="p-3 rounded-2xl bg-brand-700 text-white font-bold flex justify-between">
                  <span>brand-700 #B92F51 (Hover)</span>
                </div>
                <div className="p-3 rounded-2xl bg-brand-100 text-ink font-bold flex justify-between border border-brand-400/40">
                  <span>brand-100 #FFE3EA</span>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#8B7CF6] to-[#F472B6] text-white font-bold shadow-soft">
                  <span>Magic Gradient (Khoảnh khắc AI)</span>
                </div>
              </div>
            </div>

            {/* Status Pairs */}
            <div className="p-5 rounded-[28px] bg-surface border border-ink/10 space-y-3 shadow-card">
              <h3 className="font-heading font-bold text-sm text-ink">Trạng Thái (Nền / Chữ)</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-2xl bg-[#DDF6E9] text-[#1F8A5B] font-bold flex justify-between">
                  <span>Success</span>
                  <span>#DDF6E9 / #1F8A5B</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#FFF1B8] text-[#8A5A00] font-bold flex justify-between">
                  <span>Warning</span>
                  <span>#FFF1B8 / #8A5A00</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#FFE3EA] text-[#B42343] font-bold flex justify-between">
                  <span>Danger</span>
                  <span>#FFE3EA / #B42343</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#CDE7FF] text-[#1F5FA8] font-bold flex justify-between">
                  <span>Info</span>
                  <span>#CDE7FF / #1F5FA8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Specimens */}
          <div className="p-6 md:p-8 rounded-[28px] bg-surface border border-ink/10 shadow-card space-y-6">
            <h3 className="text-xl font-heading font-bold text-ink">Mẫu Kiểu Chữ (Typography Specimens)</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono text-ink-faint uppercase tracking-wider block mb-1">
                  Font tiêu đề: Quicksand 700
                </span>
                <p className="text-3xl font-heading font-extrabold text-ink">
                  Xứ sở Thần tiên qua Nét vẽ Diệu kỳ của Bé
                </p>
              </div>

              <div>
                <span className="text-xs font-mono text-ink-faint uppercase tracking-wider block mb-1">
                  Font nội dung: Nunito 400/600/700 (≥ 16px)
                </span>
                <p className="text-base text-ink font-body leading-relaxed max-w-3xl">
                  Bé vẽ một bông hoa mặt trời màu vàng tươi, bên cạnh có chú bướm nhỏ xinh xắn đang vỗ cánh bay lượn đón chào ngày mới ấm áp. Câu chuyện được tạo nên với sự hướng dẫn của AI an toàn và chuẩn mực giáo dục thiếu nhi.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-surface-2 border border-ink/10">
                <span className="text-xs font-mono text-brand-600 font-bold uppercase tracking-wider block mb-2">
                  Font chữ đọc truyện: Baloo 2 (Tiếng Việt đầy đủ dấu: ặ, ẫ, ồ, ử, ữ)
                </span>
                <p className="text-[clamp(22px,2.4vw,32px)] leading-[1.7] text-ink font-story font-bold">
                  “Chú voi con có chiếc vòi cong cong, vừa thổi bóng nước vừa cất tiếng hát vang khắp sườn đồi xanh ngắt. Mặt trời mỉm cười rực rỡ, chiếu những tia nắng ấm áp xuống thảm cỏ.”
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: BUTTONS */}
      {(activeTab === 'buttons' || activeTab === 'all') && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">2. Unified Button Component</h2>
            <p className="text-sm text-ink-soft">
              Component nút bấm duy nhất toàn hệ thống. Có tactile spring, 3 kích cỡ (sm 40px, md 48px, lg 56px), aria-busy và tooltip khi disabled.
            </p>
          </div>

          <div className="p-6 md:p-8 rounded-[28px] bg-surface border border-ink/10 shadow-card space-y-8">
            {/* Sizes */}
            <div>
              <h3 className="text-sm font-heading font-bold text-ink mb-4">Các Kích Cỡ (Sizes: sm 40px, md 48px, lg 56px)</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">Button Small (40px)</Button>
                <Button variant="primary" size="md">Button Medium (48px)</Button>
                <Button variant="primary" size="lg" leftIcon={<Sparkles className="w-5 h-5" />}>
                  Button Large CTA (56px)
                </Button>
              </div>
            </div>

            {/* Variants */}
            <div>
              <h3 className="text-sm font-heading font-bold text-ink mb-4">Các Biến Thể (Variants)</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="md" leftIcon={<BookOpen className="w-4 h-4" />}>
                  Primary (brand-600)
                </Button>
                <Button variant="magic" size="md" leftIcon={<Sparkles className="w-4 h-4" />}>
                  Magic AI (Chỉ cho tạo truyện)
                </Button>
                <Button variant="secondary" size="md">
                  Secondary (Viền ink/15)
                </Button>
                <Button variant="soft" size="md">
                  Soft Pastel
                </Button>
                <Button variant="ghost" size="md">
                  Ghost Button
                </Button>
                <Button variant="danger" size="md" leftIcon={<Trash2 className="w-4 h-4" />}>
                  Danger Button
                </Button>
              </div>
            </div>

            {/* States: Loading & Disabled with Tooltip */}
            <div>
              <h3 className="text-sm font-heading font-bold text-ink mb-4">Trạng Thái: Loading & Disabled (kèm Tooltip giải thích lý do)</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="md" isLoading>
                  Đang tải...
                </Button>
                <Button variant="magic" size="md" isLoading>
                  AI Đang Dệt Truyện...
                </Button>
                <Button 
                  variant="primary" 
                  size="md" 
                  disabled 
                  disabledTooltip="Vui lòng tải lên bức tranh vẽ trước khi tiếp tục"
                >
                  Nút Bị Khóa
                </Button>
                <Button 
                  variant="secondary" 
                  size="md" 
                  disabled 
                  disabledTooltip="Chỉ phụ huynh đã đặt mã PIN mới có thể sử dụng tính năng này"
                >
                  Khóa Phụ Huynh
                </Button>
              </div>
            </div>

            {/* Interactive Spring Test */}
            <div className="p-4 rounded-2xl bg-surface-2 border border-ink/10 flex items-center justify-between">
              <div>
                <div className="font-heading font-bold text-sm text-ink">Thử nghiệm phản hồi xúc giác (Tactile feedback)</div>
                <div className="text-xs text-ink-soft">Bấm thử nút Toast bên cạnh để cảm nhận chuyển động nhún Framer Motion spring:</div>
              </div>
              <Button
                variant="magic"
                size="md"
                onClick={() => toast.success('Phản hồi xúc giác mượt mà!')}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Nhấn Để Thử Toast
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: CARDS & FRAMES */}
      {(activeTab === 'cards' || activeTab === 'all') && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">3. Cards & Polaroid Frame</h2>
            <p className="text-sm text-ink-soft">
              Đổ bóng mềm nhiều lớp, bo góc 28px. Bỏ hoàn toàn tấm đế be dày thô kệch. Tranh của bé đóng khung polaroid nghiêng nhẹ 1.5°.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Standard Soft Card */}
            <Card variant="white" className="p-6 space-y-3">
              <Badge variant="mint" size="sm">White Surface</Badge>
              <h3 className="text-lg font-heading font-bold text-ink">Thẻ Tiêu Chuẩn</h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Được bo góc 28px chuẩn mực, hiệu ứng bóng đổ nhiều lớp mềm mại và không còn bất kỳ tấm đế be dày nào.
              </p>
              <Button variant="secondary" size="sm">Chi tiết</Button>
            </Card>

            {/* Surface-2 Card */}
            <Card variant="cream" className="p-6 space-y-3">
              <Badge variant="peach" size="sm">Surface 2 Cream</Badge>
              <h3 className="text-lg font-heading font-bold text-ink">Thẻ Phụ Bề Mặt Kem</h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Dùng cho các khối thống kê, ghi chú an toàn hoặc thông tin bổ trợ trong trang cá nhân.
              </p>
              <Button variant="soft" size="sm">Xem Thêm</Button>
            </Card>

            {/* Polaroid Artwork Frame */}
            <div className="p-6 rounded-[28px] bg-surface-2 border border-ink/10 flex flex-col items-center justify-center">
              <div className="relative group rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300">
                {/* Tape decal */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-butter/80 rounded-sm shadow-xs border border-ink/10 z-10 -rotate-2" />
                
                {/* Polaroid Frame */}
                <div className="bg-white p-3 pb-5 rounded-2xl shadow-card border border-ink/10 max-w-[220px]">
                  <div className="w-48 h-36 rounded-xl overflow-hidden bg-peach/30 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80"
                      alt="Tranh vẽ bé yêu"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <span className="font-heading font-extrabold text-xs text-ink block">Chú Voi Bông</span>
                    <span className="text-[10px] text-ink-faint">Bé Bơ • 5 tuổi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: FORMS & BADGES */}
      {(activeTab === 'forms' || activeTab === 'all') && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">4. Form Controls & Badges</h2>
            <p className="text-sm text-ink-soft">
              Input bo góc 16px, OTP PIN 4 ô riêng biệt, chip lọc và các huy hiệu trạng thái.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs & OTP */}
            <Card variant="white" className="p-6 md:p-8 space-y-5">
              <h3 className="text-lg font-heading font-bold text-ink">Inputs & PIN OTP</h3>
              
              <div className="space-y-4">
                <Input
                  label="Tên nhân vật hoặc tiêu đề"
                  placeholder="Ví dụ: Chú gấu thích ngắm trăng..."
                  helperText="Gợi ý từ ngữ ấm áp cho câu chuyện"
                />

                <Input
                  label="Ô tìm kiếm truyện"
                  placeholder="Tìm theo nhân vật, bài học..."
                  leftIcon={<Search className="w-4 h-4 text-ink-faint" />}
                />

                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-heading font-bold text-ink">
                    Mã PIN 4 số kiểu OTP (Bảo mật phụ huynh)
                  </label>
                  <OtpPinInput
                    value={pinValue}
                    onChange={setPinValue}
                  />
                  <span className="text-xs text-ink-faint block mt-1">
                    Giá trị hiện tại: <strong>{pinValue.length === 4 ? 'Đủ 4 số' : `${pinValue.length}/4 số`}</strong>
                  </span>
                </div>
              </div>
            </Card>

            {/* Badges & Chips */}
            <Card variant="white" className="p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-heading font-bold text-ink">Badges & Selectable Chips</h3>

              {/* Status Pills */}
              <div className="space-y-2">
                <span className="text-xs font-heading font-bold text-ink-soft block">Trạng Thái Hệ Thống</span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success" size="sm">Đã duyệt tự động</Badge>
                  <Badge variant="warning" size="sm">Chờ kiểm duyệt</Badge>
                  <Badge variant="danger" size="sm">Bị từ chối</Badge>
                  <Badge variant="sky" size="sm">Đang dệt truyện</Badge>
                </div>
              </div>

              {/* Pastel Decorative Badges */}
              <div className="space-y-2">
                <span className="text-xs font-heading font-bold text-ink-soft block">Pastel Phụ Trợ</span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="mint" size="sm">🌿 Mint</Badge>
                  <Badge variant="peach" size="sm">🍑 Peach</Badge>
                  <Badge variant="sky" size="sm">☁️ Sky</Badge>
                  <Badge variant="lavender" size="sm">🌸 Lavender</Badge>
                  <Badge variant="butter" size="sm">⭐ Butter</Badge>
                </div>
              </div>

              {/* Chips */}
              <div className="space-y-2">
                <span className="text-xs font-heading font-bold text-ink-soft block">Interactive Filter Chips</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'Tất cả truyện' },
                    { id: 'fav', label: '⭐ Yêu thích' },
                    { id: 'kid1', label: '🥑 Bé Bơ' },
                    { id: 'kid2', label: '🐿️ Sóc Nâu' },
                  ].map((chip) => (
                    <Chip
                      key={chip.id}
                      selected={selectedChip === chip.id}
                      onClick={() => setSelectedChip(chip.id)}
                    >
                      {chip.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* SECTION 5: MODALS & EMPTY STATES & SKELETONS */}
      {(activeTab === 'states' || activeTab === 'all') && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">5. Modals, ConfirmDialog, Skeletons & Empty States</h2>
            <p className="text-sm text-ink-soft">
              Các trạng thái thông báo, dialog xác nhận hành động nguy hiểm và minh họa rỗng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Modal Triggers */}
            <Card variant="white" className="p-6 md:p-8 space-y-4">
              <h3 className="text-lg font-heading font-bold text-ink">Hộp Thoại (Modals & Dialogs)</h3>
              <p className="text-sm text-ink-soft">
                Hỗ trợ khóa phím Esc, click backdrop, mobile bottom sheet và focus trap.
              </p>
              
              <div className="flex flex-col gap-3 pt-2">
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                  Mở Modal Thông Tin
                </Button>
                <Button variant="danger" size="sm" onClick={() => setIsConfirmOpen(true)}>
                  Mở ConfirmDialog Xóa ("XOA")
                </Button>
              </div>
            </Card>

            {/* Skeletons Preview */}
            <Card variant="white" className="p-6 md:p-8 space-y-4">
              <h3 className="text-lg font-heading font-bold text-ink">Skeletons (Tải nội dung)</h3>
              <div className="flex items-center gap-4">
                <Skeleton variant="circular" className="w-12 h-12 shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton variant="rounded" className="h-4 w-3/4" />
                  <Skeleton variant="rounded" className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton variant="card" className="h-28 w-full mt-4" />
            </Card>

            {/* Empty State Preview */}
            <Card variant="white" className="p-6">
              <EmptyState
                title="Chưa có bức tranh nào"
                description="Hãy dùng camera chụp lại bức vẽ trên giấy của bé nhé!"
                actionText="Chụp Tranh Ngay"
                onAction={() => toast.info('Điều hướng tới /create')}
              />
            </Card>
          </div>
        </section>
      )}

      {/* Test Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Giới thiệu Tính năng Thần kỳ hóa"
        description="Mô hình Gemini 2.5 Flash phân tích tranh vẽ theo 3 lớp an toàn Responsible AI."
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-ink-soft">
            Mỗi chi tiết, nhân vật và màu sắc do bé tự vẽ sẽ trở thành nhân vật chính sống động trong truyện cổ tích 4 trang.
          </p>
          <div className="pt-4 flex justify-end gap-2 border-t border-ink/10">
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog Test */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          toast.success('Đã xác nhận xóa an toàn!');
          setIsConfirmOpen(false);
        }}
        title="Xác nhận xóa câu chuyện này?"
        description="Thao tác này không thể hoàn tác. Toàn bộ tranh vẽ và nội dung truyện sẽ bị xóa vĩnh viễn."
        confirmWord="XOA"
        confirmText="Xác nhận xóa vĩnh viễn"
      />
    </div>
  );
};
