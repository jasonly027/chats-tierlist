import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TieredItem } from '@/features/tierlist/types/tier-list';
import { getTierColor } from '@/features/tierlist/utils/get-tier-color';

export default function Votes({ item }: { item: TieredItem }) {
  return (
    <div>
      <h3 className="mb-1 text-center text-lg">Votes - ({item.totalVotes})</h3>
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
  if (!tierList) return;

  const tier = tierList.tiers[stat.tierIdx];
  if (!tier) return null;

  const color = getTierColor(stat.tierIdx);
  const percent = ((stat.votes / totalVotes) * 100).toFixed(0);

  return (
    <div>
      <div className="flex items-center justify-between gap-10">
        <div className="flex min-w-0 items-center text-nowrap">
          <span style={{ color }} className="truncate font-bold">
            {tier.name}
          </span>
          &nbsp;
          {`- (${stat.votes})`}
        </div>
        {percent}%
      </div>

      <div className="flex h-3 overflow-hidden rounded-lg bg-gray-900">
        <div
          style={{ backgroundColor: color, width: `${percent}%` }}
          className="transition-[width] duration-800"
        ></div>
      </div>
    </div>
  );
}
