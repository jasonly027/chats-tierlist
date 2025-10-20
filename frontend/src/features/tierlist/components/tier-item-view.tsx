import { useMemo } from 'react';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TieredItem } from '@/features/tierlist/types/tier-list';

export interface TierItemViewProps {
  item?: TieredItem;
}

export default function TierItemView({ item }: TierItemViewProps) {
  if (!item) {
    return (
      <div className="bg-surface min-h-50 p-2 text-center text-gray-400">
        Select an item
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface flex flex-col justify-center gap-2 p-4">
        <h2 className="text-center text-lg font-bold">{item.name}</h2>
        <img
          src={item.imageUrl ?? undefined}
          alt="Item Image"
          className="h-50 self-center rounded-sm object-cover"
        />
        <ItemVotes item={item} />
      </div>
    </>
  );
}

interface ItemVotesProps {
  item: TieredItem;
}

function ItemVotes({ item }: ItemVotesProps) {
  const { tierList } = useTierList();
  const orderedStats = useMemo(
    () => [...item.stats].sort((a, b) => a.tierIdx - b.tierIdx),
    [item]
  );

  if (!tierList) return null;

  return (
    <div>
      <h3 className="text-center text-lg">Votes - ({item.totalVotes})</h3>
      {orderedStats.map((stat) => (
        <ItemTierBar
          key={stat.tierIdx}
          stat={stat}
          totalVotes={item.totalVotes}
        />
      ))}
    </div>
  );
}

interface ItemTierBarProps {
  stat: TieredItem['stats'][number];
  totalVotes: number;
}

function ItemTierBar({ stat, totalVotes }: ItemTierBarProps) {
  const { tierList } = useTierList();
  if (!tierList) return null;

  const tier = tierList.tiers[stat.tierIdx]!;
  const percent = ((stat.votes / totalVotes) * 100).toFixed(0);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between">
        <span className="text-left">
          <span style={{ color: tier.color }} className="font-bold">
            {tier.name}
          </span>
          <span> - ({stat.votes})</span>
        </span>
        <span className="text-right">{percent}%</span>
      </div>

      <div className="flex h-3 overflow-hidden rounded-lg bg-gray-900">
        <div
          style={{ backgroundColor: tier.color, width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}

interface ChatterPickerProps {
  stats: TieredItem['stats'];
  votes: Record<string, number>;
}

function ChatterPicker({ stats, votes }: ChatterPickerProps) {
  const { tierList } = useTierList();

  const tierNames = useMemo(() => {
    return 
  }, []);

  return (
    <div>
      <span>Get a random chatter that voted for </span>
      <select name="Tier Picker" id="tierPicker"></select>
    </div>
  );
}
