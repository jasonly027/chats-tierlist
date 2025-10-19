import ContentEditable from 'react-contenteditable';

import TierItem from '@/features/tierlist/components/tier-item';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { Tier } from '@/features/tierlist/types/tier-list';

export interface TierListRowProps {
  tier: Tier;
}

export default function TierRow({ tier }: TierListRowProps) {
  const { setTierList } = useTierList();

  return (
    <div className="bg-surface flex flex-row">
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
        className="flex min-h-20 w-24 items-center justify-center text-center wrap-anywhere"
      />
      <div>
        {tier.items.map((item) => (
          <TierItem key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
}
