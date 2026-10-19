import React from 'react';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useAdminStore();

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('APPROVE')) return 'mint';
    if (action.includes('REJECT') || action.includes('LOCK')) return 'danger';
    if (action.includes('UPDATE') || action.includes('TOGGLE')) return 'sky';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-main">
          {vi.admin.audit.title}
        </h1>
        <p className="text-xs sm:text-sm text-main-muted mt-1">
          Lưu vết minh bạch mọi thao tác kiểm duyệt, thay đổi bộ quy tắc và cấu hình hệ thống
        </p>
      </div>

      {/* Audit Table */}
      <Card variant="white" className="p-0 border-2 border-peach/50 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-cream-200 border-b border-peach/40 text-main font-heading font-bold">
              <tr>
                <th className="p-4">{vi.admin.audit.colTimestamp}</th>
                <th className="p-4">{vi.admin.audit.colAdmin}</th>
                <th className="p-4">{vi.admin.audit.colAction}</th>
                <th className="p-4">{vi.admin.audit.colTarget}</th>
                <th className="p-4">{vi.admin.audit.colDetails}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach/30">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-cream-100/60 transition-colors">
                  <td className="p-4 text-main-muted whitespace-nowrap font-mono text-xs">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="p-4 font-bold text-main whitespace-nowrap">
                    Admin
                  </td>
                  <td className="p-4">
                    <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="p-4 font-mono text-xs text-accent">
                    {log.target_type} ({log.target_id.substring(0, 10)}...)
                  </td>
                  <td className="p-4 text-xs font-mono text-main-muted max-w-xs md:max-w-md truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
