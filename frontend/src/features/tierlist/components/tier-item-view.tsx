import { useEffect, useMemo, useState, type ChangeEvent } from 'react';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TieredItem } from '@/features/tierlist/types/tier-list';

export interface TierItemViewProps {
  item?: TieredItem;
}

export default function TierItemView({ item }: TierItemViewProps) {
  if (!item) {
    return (
      <div className="bg-surface min-h-51 p-3">
        <h2 className="text-center text-lg font-bold text-gray-400">
          Select an item
        </h2>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface flex flex-col justify-center gap-3 p-3">
        <Title item={item} />
        <img
          src={item.imageUrl ?? undefined}
          alt="Item Image"
          className="h-50 self-center rounded-sm object-cover"
        />
        <ItemVotes item={item} />
        <ChatterPicker stats={item.stats} votes={item.votes} />
      </div>
    </>
  );
}

interface TitleProps {
  item: TieredItem;
}

function Title({ item }: TitleProps) {
  const [name, setName] = useState(item.name);
  useEffect(
    function refreshOnNewName() {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setName(item.name);
    },
    [item.name]
  );

  const { updateItem } = useTierList();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    updateItem(item.name, { name: newName });
  };

  return (
    <input
      value={name}
      onChange={onChange}
      className="text-center text-lg font-bold text-ellipsis"
    />
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
  const [chatter, setChatter] = useState<string>();
  const [tierFilter, setTierFilter] = useState<number>(stats[0]!.tierIdx);

  useEffect(
    function refreshOnNewStats() {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setChatter(undefined);
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setTierFilter(stats[0]!.tierIdx);
    },
    [stats]
  );

  const { tierList } = useTierList();
  const tiers = useMemo(() => {
    if (!tierList) return [];

    return stats.map(({ tierIdx }) => ({
      name: tierList.tiers[tierIdx]!.name,
      idx: tierIdx,
    }));
  }, [stats, tierList]);

  const pickRandomChatter = () => {
    const chatters = Object.entries(votes).filter(
      ([, tierIdx]) => tierIdx === tierFilter
    );
    setChatter(chatters[Math.floor(Math.random() * chatters.length)]![0]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <span className="text-center">
          Get a random chatter that voted for{' '}
        </span>
        <select
          name="Tier Picker"
          id="tierPicker"
          onChange={(e) => setTierFilter(Number(e.target.value))}
          className="rounded-sm border-2 border-gray-900 px-1"
        >
          {tiers.map(({ name, idx }) => (
            <option key={name} value={idx} className="bg-surface">
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={pickRandomChatter}
          className="hover:bg-surface-light mx-1 rounded-sm bg-gray-900 p-2 text-lg font-bold transition-colors duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <span className="sr-only">Get random chatter</span>
        </button>
      </div>
      <div className="text-center text-lg font-bold">{chatter}</div>
    </div>
  );
}
