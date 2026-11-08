import React, { useState } from 'react';
import { Download, AlertTriangle, Search, DollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatCurrencyUSD, formatDate } from '@/lib/utils';

export const CostsQuotasPage: React.FC = () => {
  const { 
    kpis, 
    aiLogs, 
    globalDailyLimit, 
    updateGlobalDailyLimit, 
    exportAiLogsCsv 
  } = useAdminStore();

  const [limitInput, setLimitInput] = useState(globalDailyLimit);
  const [searchQuery, setSearchQuery] = useState('');

  const isBudgetWarning = kpis.monthlyCostUsd >= kpis.monthlyBudgetUsd * 0.8;

  const filteredLogs = aiLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.model.toLowerCase().includes(q) ||
      (log.user_id && log.user_id.toLowerCase().includes(q))
    );
  });

  const handleExportCsv = () => {
    const csvContent = exportAiLogsCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ai_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file CSV lịch sử API thành công!');
  };

  const handleSaveLimit = () => {
    updateGlobalDailyLimit(Number(limitInput));
    toast.success(`Đã cập nhật hạn mức toàn hệ thống thành ${limitInput} truyện/ngày!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-main">
            {vi.admin.costs.title}
          </h1>
          <p className="text-xs sm:text-sm text-main-muted mt-1">
            Theo dõi chi phí token Google Gemini theo thời gian thực và quản trị ngân sách
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          leftIcon={<Download className="w-4 h-4" />}
        >
          {vi.admin.costs.exportCsv}
        </Button>
      </div>

      {/* Budget Status & Daily Limit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Budget Card */}
        <Card variant="white" className="p-6 border-2 border-peach/50 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-main-muted">
              {vi.admin.costs.monthlyBudget}
            </span>
            <Badge variant={isBudgetWarning ? 'warning' : 'mint'} size="sm">
              {formatCurrencyUSD(kpis.monthlyCostUsd)} / {formatCurrencyUSD(kpis.monthlyBudgetUsd)}
            </Badge>
          </div>

          {/* Budget Progress Bar */}
          <div className="w-full bg-cream-200 h-3 rounded-full overflow-hidden p-0.5 border border-peach/40">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBudgetWarning ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (kpis.monthlyCostUsd / kpis.monthlyBudgetUsd) * 100)}%` }}
            />
          </div>

          {isBudgetWarning ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{vi.admin.costs.budgetWarning}</span>
            </div>
          ) : (
            <span className="text-xs text-emerald-700 font-semibold block">
              ✓ Chi phí vận hành đang nằm trong hạn mức an toàn của đồ án.
            </span>
          )}
        </Card>

        {/* Global Daily Limit Control */}
        <Card variant="white" className="p-6 border-2 border-peach/50 space-y-3">
          <span className="text-xs font-heading font-bold text-main">
            {vi.admin.costs.globalLimitLabel}
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={50}
              value={limitInput}
              onChange={(e) => setLimitInput(Number(e.target.value))}
              className="font-heading font-bold text-base"
            />
            <Button variant="primary" size="md" onClick={handleSaveLimit} leftIcon={<Save className="w-4 h-4" />}>
              Lưu
            </Button>
          </div>
          <span className="text-[11px] text-main-muted block">
            Mặc định 5 truyện/ngày để chống spam và kiểm soát chi phí.
          </span>
        </Card>
      </div>

      {/* AI Logs Data Grid */}
      <Card variant="white" className="p-0 border-2 border-peach/50 overflow-hidden shadow-soft space-y-0">
        <div className="p-4 bg-cream-100 border-b border-peach/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h2 className="font-heading font-bold text-sm text-main">
              {vi.admin.costs.logsTable} ({filteredLogs.length} bản ghi)
            </h2>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-main-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo thao tác, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-peach/40 text-xs text-main placeholder:text-main-muted focus:outline-none focus:border-primary min-h-[36px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-200 border-b border-peach/30 text-main font-heading font-bold sticky top-0 z-10">
              <tr>
                <th className="p-3.5">{vi.admin.costs.colTime}</th>
                <th className="p-3.5">{vi.admin.costs.colAction}</th>
                <th className="p-3.5">Model</th>
                <th className="p-3.5 text-center">{vi.admin.costs.colTokens}</th>
                <th className="p-3.5 text-center">{vi.admin.costs.colLatency}</th>
                <th className="p-3.5 text-right">{vi.admin.costs.colCost}</th>
                <th className="p-3.5 text-center">{vi.admin.costs.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach/30">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-main-muted font-bold">
                    Chưa có dữ liệu gọi AI trong hệ thống.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-cream-100/60 transition-colors">
                    <td className="p-3.5 text-main-muted whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="p-3.5 font-bold text-main">
                      {log.action}
                    </td>
                    <td className="p-3.5 font-mono text-accent">
                      {log.model}
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      {log.input_tokens} / {log.output_tokens}
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      {log.latency_ms}ms
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      {formatCurrencyUSD(log.estimated_cost_usd)}
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge variant={log.status === 'success' ? 'mint' : 'danger'} size="sm">
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

