import { queryOptions, useQuery } from '@tanstack/react-query';

import type {
  Item,
  TieredItem,
  TierList,
  TierListDto,
  TierListRequest,
} from '@/features/tierlist/types/tier-list';
import type { QueryConfig } from '@/lib/react-query';

interface UseGetTierListOptions {
  name: string;
  queryConfig?: QueryConfig<typeof getTierListOptions>;
}

export function useGetTierList({ queryConfig, name }: UseGetTierListOptions) {
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
        id: '0',
        name: 'S',
        color: 'red',
      },
      {
        id: '1',
        name: 'A',
        color: 'blue',
      },
      {
        id: '2',
        name: 'B',
        color: 'green',
      },
      {
        id: 'tier4',
        name: 'C',
        color: 'green',
      },
      {
        id: 'tier5',
        name: 'D',
        color: 'green',
      },
      {
        id: 'tier6',
        name: 'E',
        color: 'green',
      },
      {
        id: 'tier7',
        name: 'F',
        color: 'green',
      },
      {
        id: 'tier8',
        name: 'Z',
        color: 'green',
      },
      {
        id: 'tier9',
        name: 'Za',
        color: 'green',
      },
      {
        id: 'tier10',
        name: 'Za',
        color: 'green',
      },
    ],
    items: {
      egg: {
        id: '3',
        imageUrl:
          'https://www.freefoodphotos.com/imagelibrary/dairy/egg_basket.jpg',
        votes: {
          Alex: 0,
          Jason: 1,
          Alice: 2,
        },
      },
      ['One Two Three Four Five Six Seven Eight Nine Ten Eleven']: {
        id: '4',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Rooster_portrait2.jpg/1024px-Rooster_portrait2.jpg',
        votes: {
          Alex: 0,
        },
      },
      Sandwich: {
        id: '5',
        imageUrl: null,
        votes: {
          Alex: 2,
        },
      },
      Caramel: {
        id: '6',
        imageUrl: null,
        votes: {},
      },
    },
    focus: null,
    isVoting: true,
    version: 1,
  };

  const tierList = dtoToTierList(dummy);

  return tierList;
}

export function dtoToTierList(dto: TierListDto): TierList {
  const tierList: TierList = {
    tiers: [],
    pool: [],
    focus: dto.focus,
    isVoting: dto.isVoting,
    version: dto.version,
    items: {},
  };

  // Add tiers
  for (const [idx, { id, name }] of dto.tiers.entries()) {
    tierList.tiers.push({ id, name, idx });
  }

  for (const [name, { id, imageUrl, votes }] of Object.entries(dto.items)) {
    const item: Item = { id, name, imageUrl };

    const tierIndices = Object.values(votes);
    // Push as item if no votes
    if (tierIndices.length === 0) {
      tierList.items[item.id] = item;
      continue;
    }

    // Otherwise, create tiered item
    const collectedVotes = tierIndices.reduce<Record<number, number>>(
      (stats, tierIdx) => {
        if (stats[tierIdx] === undefined) {
          stats[tierIdx] = 0;
        }
        stats[tierIdx] += 1;

        return stats;
      },
      {}
    );
    const stats = Object.entries(collectedVotes)
      .map(([tierIdx, votes]) => ({
        tierIdx: Number(tierIdx),
        votes,
      }))
      .sort((a, b) => a.tierIdx - b.tierIdx);

    const { score, totalVotes } = stats.reduce(
      (acc, { tierIdx, votes }) => {
        acc.score += votes * tierIdx;
        acc.totalVotes += votes;

        return acc;
      },
      { score: 0, totalVotes: 0 }
    );
    const average = score / totalVotes;

    const numberOfTiers = tierList.tiers.length;
    const tierIdx =
      numberOfTiers > 1
        ? Math.min(
            Math.floor((average * numberOfTiers) / (numberOfTiers - 1)),
            numberOfTiers - 1
          )
        : 0;

    const tieredItem: TieredItem = {
      ...item,
      average,
      tierIdx,
      totalVotes,
      stats,
      votes,
    };

    tierList.items[tieredItem.id] = tieredItem;
  }

  return tierList;
}

export function tierListToDto(list: TierList): TierListRequest {
  const tiers = list.tiers.reduce<TierListRequest['tiers']>((acc, { name }) => {
    acc[name] = {
      color: 'blue',
    };
    return acc;
  }, {});

  const items = Object.values(list.items).reduce<TierListRequest['items']>(
    (acc, { name, imageUrl }) => {
      acc[name] = {
        image_url: imageUrl ?? undefined,
      };
      return acc;
    },
    {}
  );

  return {
    tiers,
    items,
  };
}
