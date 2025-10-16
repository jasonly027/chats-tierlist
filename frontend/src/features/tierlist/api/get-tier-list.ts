import { queryOptions, useQuery } from '@tanstack/react-query';

import type {
  Item,
  TieredItem,
  TierList,
  TierListDto,
} from '@/features/tierlist/types/tier-list';
import type { QueryConfig } from '@/lib/react-query';

interface UseTierListOptions {
  name: string;
  queryConfig?: QueryConfig<typeof getTierListOptions>;
}

export function useTierList({ queryConfig, name }: UseTierListOptions) {
  return useQuery({
    ...getTierListOptions(name),
    ...queryConfig,
  });
}

export function getTierListOptions(name: string) {
  return queryOptions({
    queryKey: ['tierlist', name],
    queryFn: getTierList,
  });
}

function getTierList() {
  const dummy: TierListDto = {
    tiers: [
      {
        name: 'S',
        color: 'red',
      },
      {
        name: 'A',
        color: 'blue',
      },
    ],
    items: {
      egg: {
        imageUrl:
          'https://www.freefoodphotos.com/imagelibrary/dairy/egg_basket.jpg',
        votes: {
          Alex: 0,
          Jason: 1,
        },
      },
      chicken: {
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Rooster_portrait2.jpg/1024px-Rooster_portrait2.jpg',
        votes: {
          Alex: 0,
        },
      },
    },
    focus: null,
    isVoting: true,
    version: 1,
  };

  const tierList = dtoToTierList(dummy);

  return tierList;
}

function dtoToTierList(dto: TierListDto): TierList {
  const tierList: TierList = {
    tiers: [],
    pool: [],
    focus: dto.focus,
    isVoting: dto.isVoting,
    version: dto.version,
  };

  // Add tiers
  for (const { name, color } of dto.tiers) {
    tierList.tiers.push({ name, color, items: [] });
  }

  for (const [name, { imageUrl, votes }] of Object.entries(dto.items)) {
    const item: Item = { name, imageUrl };

    const tierIndices = Object.values(votes);
    // Just place in the pool if there are no votes.
    if (tierIndices.length === 0) {
      tierList.pool.push(item);
      continue;
    }

    // Otherwise, calculate stats
    const tierStats: Record<number, number> = {};
    for (const tierIdx of tierIndices) {
      if (tierStats[tierIdx] === undefined) {
        tierStats[tierIdx] = 0;
      }
      tierStats[tierIdx] += 1;
    }
    const stats: TieredItem['stats'] = Object.entries(tierStats)
      .map(([tierIdx, votes]) => ({
        tierIdx: Number(tierIdx),
        votes,
      }))
      .sort((a, b) => b.votes - a.votes);

    const { score, totalVotes } = stats.reduce(
      (acc, { tierIdx, votes }) => {
        acc.score += votes * tierIdx;
        acc.totalVotes += votes;

        return acc;
      },
      { score: 0, totalVotes: 0 }
    );
    const weightedAverage = score / totalVotes;

    const tieredItem: TieredItem = {
      ...item,
      totalVotes,
      weightedAverage,
      stats,
      votes,
    };

    const numberOfTiers = tierList.tiers.length;
    const tierIdx =
      numberOfTiers > 1
        ? Math.floor((weightedAverage * numberOfTiers) / (numberOfTiers - 1))
        : 0;
    tierList.tiers[tierIdx]!.items.push(tieredItem);
  }

  tierList.tiers.forEach((tier) =>
    tier.items.sort((a, b) => a.weightedAverage - b.weightedAverage)
  );

  return tierList;
}
