'use client';

import type {
  TabType,
  ProfileTabsProps,
} from '@/core/types/components/profile';

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs: TabType[] = ['overview', 'security'];

  return (
    <div className="flex space-x-8 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`pb-4 px-1 text-sm font-medium capitalize transition-colors relative ${
            activeTab === tab
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab}
          {activeTab === tab && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}

