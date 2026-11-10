import { useState } from 'react';
import { AppBar } from '../../shared/layout/AppBar';
import { KeepingTab } from './KeepingTab';
import { PendingClaimsTab } from './PendingClaimsTab';
import { StatsTab } from './StatsTab';

const TABS = [
  { id: 'pending', label: '승인 대기' },
  { id: 'keeping', label: '보관 중' },
  { id: 'stats', label: '요약' },
] as const;
type TabId = (typeof TABS)[number]['id'];

/** ⑩ 관리자 — 교사 전용. 승인 대기 / 보관 중 / 요약 */
export function AdminPage() {
  const [tab, setTab] = useState<TabId>('pending');

  return (
    <>
      <AppBar title="관리자" />
      <div className="px-4 pb-8 pt-3">
        <div role="tablist" aria-label="관리자 메뉴" className="grid grid-cols-3 gap-1 rounded-field bg-bg-3 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`admin-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`admin-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`h-9 rounded-[8px] text-[13px] font-bold ${tab === t.id ? 'bg-bg-1 text-tx-1 shadow-sm' : 'text-tx-2'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`admin-panel-${tab}`} aria-labelledby={`admin-tab-${tab}`} className="mt-4">
          {tab === 'pending' && <PendingClaimsTab />}
          {tab === 'keeping' && <KeepingTab />}
          {tab === 'stats' && <StatsTab />}
        </div>
      </div>
    </>
  );
}
