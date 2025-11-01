import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TieredItem } from '@/features/tierlist/types/tier-list';
import { getTierColor } from '@/features/tierlist/utils/get-tier-color';

export default function Votes({ item }: { item: TieredItem }) {
  return (
    <div>
      <h3 className="text-center text-lg">Votes - ({item.totalVotes})</h3>
      {item.stats.map((stat) => (
        <TierBar key={stat.tierIdx} stat={stat} totalVotes={item.totalVotes} />
      ))}
    </div>
  );
}

interface TierBarProps {
  stat: TieredItem['stats'][number];
  totalVotes: number;
}

function TierBar({ stat, totalVotes }: TierBarProps) {
  const { tierList } = useTierList();
  if (!tierList) return null;
  const tier = tierList.tiers[stat.tierIdx];
  if (!tier) return null;

  const color = getTierColor(stat.tierIdx);
  const percent = ((stat.votes / totalVotes) * 100).toFixed(0);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between">
        <span className="text-left">
          <span style={{ color }} className="font-bold">
            {tier.name}
          </span>
          <span> - ({stat.votes})</span>
        </span>
        <span className="text-right">{percent}%</span>
      </div>

      <div className="flex h-3 overflow-hidden rounded-lg bg-gray-900">
        <div style={{ backgroundColor: color, width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
