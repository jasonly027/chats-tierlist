import type { Dispatch, SetStateAction } from 'react';
import ContentEditable from 'react-contenteditable';

import TierItem from '@/features/tierlist/components/tier-item';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { Tier, TieredItem } from '@/features/tierlist/types/tier-list';

export interface TierListRowProps {
  tier: Tier;
  setDetailedItem: Dispatch<SetStateAction<TieredItem | undefined>>;
}

export default function TierRow({ tier, setDetailedItem }: TierListRowProps) {
  const { setTierList } = useTierList();

  return (
    <div className="flex flex-row bg-gray-900">
      <ContentEditable
        html={tier.name}
        onChange={(e) => {
          const newName = e.target.value;
          setTierList({
            action: 'updateTier',
            payload: { tierName: tier.name, data: { name: newName } },
          });
        }}
        style={{ backgroundColor: tier.color }}
        className="flex min-h-24 min-w-24 items-center justify-center text-center wrap-anywhere"
      />
      <div className="flex flex-row flex-wrap">
        {tier.items.map((item) => (
          <div key={item.name} onClick={() => setDetailedItem(item)}>
            <TierItem item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
