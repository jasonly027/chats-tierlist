import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/ui/button';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TieredItem } from '@/features/tierlist/types/tier-list';

export interface ChatterPickerProps {
  stats: TieredItem['stats'];
  votes: Record<string, number>;
}

export default function ChatterPicker({ stats, votes }: ChatterPickerProps) {
  const [chatter, setChatter] = useState<string>();
  const [tierFilter, setTierFilter] = useState<number | undefined>(
    stats[0]?.tierIdx
  );

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
    setChatter(chatters[Math.floor(Math.random() * chatters.length)]?.[0]);
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-1">
        <span className="text-center">Get a random chatter that voted for</span>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="tierPicker"
            name="tierPicker"
            onChange={(e) => setTierFilter(Number(e.target.value))}
            className="h-8 max-w-[8ch] rounded-sm border-2 border-gray-900 bg-slate-700 px-1"
          >
            {tiers.map(({ name, idx }) => (
              <option key={name} value={idx} className="bg-slate-700">
                {name}
              </option>
            ))}
          </select>
          <Button type="button" onClick={pickRandomChatter}>
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
          </Button>
        </div>
      </div>
      {chatter && (
        <div className="mt-3 text-center text-lg font-bold">
          <span className="inline-block rounded-sm border-1 px-2 py-1 wrap-anywhere">
            {chatter}
          </span>
        </div>
      )}
    </div>
  );
}
