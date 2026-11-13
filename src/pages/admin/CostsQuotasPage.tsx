import React, { useState, useEffect } from 'react';
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
    updateMonthlyBudget,
    exportAiLogsCsv,
  } = useAdminStore();

  const [limitInput, setLimitInput] = useState(globalDailyLimit);
  const [budgetInput, setBudgetInput] = useState(kpis.monthlyBudgetUsd);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavingLimit, setIsSavingLimit] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  useEffect(() => {
    setLimitInput(globalDailyLimit);
  }, [globalDailyLimit]);

  useEffect(() => {
    setBudgetInput(kpis.monthlyBudgetUsd);
  }, [kpis.monthlyBudgetUsd]);

  const budgetRatio =
    kpis.monthlyBudgetUsd > 0 ? (kpis.monthlyCostUsd / kpis.monthlyBudgetUsd) * 100 : 0;
  const isBudgetWarning = budgetRatio >= 80;

  const filteredLogs = aiLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.model.toLowerCase().includes(q) ||
      (log.error_code && log.error_code.toLowerCase().includes(q)) ||
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

  const handleSaveLimit = async () => {
    const val = Math.max(1, Math.min(100, Number(limitInput) || 5));
    setIsSavingLimit(true);
    const ok = await updateGlobalDailyLimit(val);
    setIsSavingLimit(false);
    if (ok) {
      toast.success(`Đã cập nhật hạn mức toàn hệ thống thành ${val} truyện/ngày!`);
    } else {
      toast.error('Không thể cập nhật hạn mức toàn hệ thống.');
    }
  };

  const handleSaveBudget = async () => {
    const val = Math.max(1, Number(budgetInput) || 50);
    setIsSavingBudget(true);
    const ok = await updateMonthlyBudget(val);
    setIsSavingBudget(false);
    if (ok) {
      toast.success(`Đã cập nhật ngân sách tháng thành ${formatCurrencyUSD(val)}!`);
    } else {
      toast.error('Không thể lưu ngân sách tháng.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
            {vi.admin.costs.title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Theo dõi chi phí token Google Gemini theo thời gian thực và kiểm soát hạn mức vận hành
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCsv}
          leftIcon={<Download className="w-4 h-4" />}
        >
          {vi.admin.costs.exportCsv}
        </Button>
      </div>

      {/* Budget Status & Daily Limit Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Budget Card */}
        <Card variant="white" className="p-6 border border-ink/10 space-y-4 shadow-card lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-heading font-extrabold text-ink">
              {vi.admin.costs.monthlyBudget}
            </span>
            <Badge variant={isBudgetWarning ? 'warning' : 'success'} size="sm">
              {formatCurrencyUSD(kpis.monthlyCostUsd)} / {formatCurrencyUSD(kpis.monthlyBudgetUsd)}
            </Badge>
          </div>

          <div className="w-full bg-surface-2 h-3 rounded-full overflow-hidden p-0.5 border border-ink/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBudgetWarning ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${Math.min(100, Math.max(1, budgetRatio))}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {isBudgetWarning ? (
              <div className="p-2.5 bg-warning-bg border border-warning-text/20 rounded-xl text-xs text-warning-text flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{vi.admin.costs.budgetWarning}</span>
              </div>
            ) : (
              <span className="text-xs text-success-text font-heading font-bold">
                ✓ Chi phí vận hành đang nằm trong ngưỡng ngân sách an toàn.
              </span>
            )}

            <div className="flex items-center gap-2 shrink-0">
              <div className="w-28">
                <Input
                  type="number"
                  min={1}
                  step="1"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(Number(e.target.value))}
                  aria-label="Ngân sách USD tháng"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                isLoading={isSavingBudget}
                onClick={handleSaveBudget}
              >
                Cập nhật ($)
              </Button>
            </div>
          </div>
        </Card>

        {/* Global Daily Limit Control */}
        <Card variant="white" className="p-6 border border-ink/10 space-y-3 shadow-card">
          <span className="text-xs font-heading font-extrabold text-ink block">
            {vi.admin.costs.globalLimitLabel}
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              value={limitInput}
              onChange={(e) => setLimitInput(Number(e.target.value))}
              className="font-heading font-bold text-base"
            />
            <Button
              variant="primary"
              size="md"
              isLoading={isSavingLimit}
              onClick={handleSaveLimit}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Lưu
            </Button>
          </div>
          <span className="text-[11px] text-ink-soft block leading-relaxed">
            Giới hạn trần áp dụng cho toàn hệ thống (hạn mức thực tế của mỗi gia đình bằng giá trị nhỏ hơn giữa hạn mức riêng và trần hệ thống).
          </span>
        </Card>
      </div>

      {/* AI Logs Data Grid */}
      <Card variant="white" className="p-0 border border-ink/10 overflow-hidden shadow-card">
        <div className="p-4 bg-surface-2 border-b border-ink/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-success-text" />
            <h2 className="font-heading font-extrabold text-sm text-ink">
              {vi.admin.costs.logsTable} ({filteredLogs.length} bản ghi)
            </h2>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo thao tác, model, mã lỗi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface border border-ink/15 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-600 min-h-[38px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-ink/10 text-ink font-heading font-extrabold sticky top-0 z-10">
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
            <tbody className="divide-y divide-ink/10">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-xs text-ink-soft font-heading font-bold">
                    Chưa có nhật ký gọi AI nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-2/60 transition-colors">
                    <td className="p-3.5 text-ink-soft whitespace-nowrap font-mono">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="p-3.5 font-heading font-bold text-ink">
                      {log.action}
                      {log.error_code && (
                        <span className="block text-[10px] font-mono text-danger-text mt-0.5">
                          {log.error_code}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-magic-600 whitespace-nowrap">
                      {log.model}
                    </td>
                    <td className="p-3.5 text-center font-mono text-ink">
                      {log.input_tokens} / {log.output_tokens}
                    </td>
                    <td className="p-3.5 text-center font-mono text-ink-soft">
                      {log.latency_ms}ms
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-success-text">
                      {formatCurrencyUSD(Number(log.estimated_cost_usd || 0))}
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge variant={log.status === 'success' ? 'success' : 'danger'} size="sm">
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
