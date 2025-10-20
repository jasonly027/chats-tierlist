import { useState } from 'react';

import Logo from '@/components/ui/logo';
import TierItemView from '@/features/tierlist/components/tier-item-view';
import TierRow from '@/features/tierlist/components/tier-row';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TieredItem } from '@/features/tierlist/types/tier-list';

export default function TierListView() {
  const { tierList, isLoading } = useTierList();
  const [detailedItem, setDetailedItem] = useState<TieredItem>();

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Logo className="animate-spin" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-row border-y-2 border-gray-950 bg-gray-800">
        <div className="flex flex-3 flex-col gap-2">
          {tierList?.tiers.map((tier, idx) => (
            <TierRow key={idx} tier={tier} setDetailedItem={setDetailedItem} />
          ))}
        </div>
        <div className="flex-1 border-l-2 border-gray-950">
          <TierItemView item={detailedItem} />
        </div>
      </div>
    </>
  );
}
