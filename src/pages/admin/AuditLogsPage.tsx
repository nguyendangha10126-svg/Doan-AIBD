import React, { useState } from 'react';
import { History, Search } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs, usersList } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('APPROVE') || action.includes('UNLOCK')) return 'success';
    if (action.includes('REJECT') || action.includes('LOCK') || action.includes('DELETE')) return 'danger';
    if (action.includes('UPDATE') || action.includes('TOGGLE') || action.includes('ACTIVATE') || action.includes('CREATE')) return 'sky';
    return 'neutral';
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.target_type.toLowerCase().includes(q) ||
      log.target_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
            {vi.admin.audit.title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Lưu vết minh bạch mọi thao tác kiểm duyệt, thay đổi bộ quy tắc và cấu hình hệ thống
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo hành động, bảng dữ liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-surface border border-ink/15 text-xs md:text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-600 min-h-[44px]"
          />
        </div>
      </div>

      {/* Audit Table */}
      <Card variant="white" className="p-0 border border-ink/10 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface-2 border-b border-ink/10 text-ink font-heading font-extrabold">
              <tr>
                <th className="p-4">{vi.admin.audit.colTimestamp}</th>
                <th className="p-4">{vi.admin.audit.colAdmin}</th>
                <th className="p-4">{vi.admin.audit.colAction}</th>
                <th className="p-4">{vi.admin.audit.colTarget}</th>
                <th className="p-4">{vi.admin.audit.colDetails}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-sm text-ink-soft font-heading font-bold">
                    <History className="w-7 h-7 text-brand-600 mx-auto mb-2" />
                    Chưa có nhật ký hoạt động nào. Hệ thống sẵn sàng ghi nhận lịch sử quản trị.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const adminProfile = usersList.find((u) => u.id === log.admin_id);
                  return (
                    <tr key={log.id} className="hover:bg-surface-2/60 transition-colors">
                      <td className="p-4 text-ink-soft whitespace-nowrap font-mono text-xs">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="p-4 font-heading font-bold text-ink whitespace-nowrap">
                        {adminProfile?.full_name || 'Quản trị viên'}
                      </td>
                      <td className="p-4">
                        <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-xs text-magic-600 whitespace-nowrap">
                        {log.target_type} ({log.target_id.substring(0, 10)})
                      </td>
                      <td className="p-4 text-xs font-mono text-ink-soft max-w-xs md:max-w-md truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
