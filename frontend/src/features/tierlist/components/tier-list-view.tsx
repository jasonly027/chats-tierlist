import { useMemo, useState } from 'react';

import Logo from '@/components/ui/logo';
import ItemDetailView from '@/features/tierlist/components/item-detail-view';
import Pool from '@/features/tierlist/components/pool';
import TierRow from '@/features/tierlist/components/tier-row';
import Toolbar from '@/features/tierlist/components/toolbar';
import VotingHelp from '@/features/tierlist/components/voting-help';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type {
  Item,
  TieredItem,
  TierList,
} from '@/features/tierlist/types/tier-list';

export default function TierListView() {
  const { tierList, errorMessage, isLoading } = useTierList();

  const [detailedItemId, setDetailedItemId] = useState<string>();
  const detailedItem = detailedItemId
    ? tierList?.items[detailedItemId]
    : undefined;

  const { tieredItems, items } = useMemo(() => {
    if (!tierList?.items) return { tieredItems: [], items: [] };
    return groupByTier(tierList.items);
  }, [tierList?.items]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Logo className="animate-spin" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-lg font-bold">{errorMessage}</p>
      </div>
    );
  }

  if (!tierList) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-lg font-bold">
          Failed to get tier list from server...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface border-x-1 border-gray-950">
        <Toolbar />

        <div className="mb-4 flex flex-col divide-gray-950 border-y-1 border-gray-950 max-md:divide-y-1 md:flex-row md:divide-x-1">
          <div className="flex flex-4 flex-col gap-px">
            {tierList.tiers.map((tier, tierIdx) => (
              <div key={tier.id} className="border-b-1 border-gray-950">
                <TierRow
                  tier={tier}
                  items={tieredItems[tierIdx] ?? []}
                  setDetailedItemId={setDetailedItemId}
                />
              </div>
            ))}
          </div>

          <div className="min-w-60 flex-2">
            <div className="sticky top-0 max-h-screen overflow-y-auto">
              <ItemDetailView item={detailedItem} />
            </div>
          </div>

          <div className="flex-1 md:max-w-fit">
            <div className="sticky top-0 max-h-screen overflow-y-auto">
              <VotingHelp />
            </div>
          </div>
        </div>

        <div className="border-t-1 border-gray-950">
          <Pool items={items} setDetailedItemId={setDetailedItemId} />
        </div>
      </div>
    </>
  );
}

function groupByTier(items: TierList['items']) {
  const tiered: TieredItem[][] = [];
  const untiered: Item[] = [];

  Object.values(items).forEach((item) => {
    if ('tierIdx' in item) {
      (tiered[item.tierIdx] ??= []).push(item);
    } else {
      untiered.push(item);
    }
  });

  tiered.forEach((items) =>
    items.sort((a, b) => a.average - b.average || a.name.localeCompare(b.name))
  );
  untiered.sort((a, b) => a.name.localeCompare(b.name));

  return { tieredItems: tiered, items: untiered };
}
