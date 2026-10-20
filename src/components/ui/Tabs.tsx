import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  layoutId = 'active-tab-indicator',
}) => {
  return (
    <div className={cn('relative flex items-center gap-1 p-1 bg-surface-2 rounded-full border border-ink/10', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-heading font-bold rounded-full transition-colors min-h-[40px]',
              isActive ? 'text-white' : 'text-ink-soft hover:text-ink'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>

            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="absolute inset-0 z-[-1] rounded-full bg-brand-600 shadow-btn-primary"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
