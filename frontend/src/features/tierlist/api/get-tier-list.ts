import { queryOptions } from '@tanstack/react-query';

import type { TierList } from '@/features/tierlist/types/tier-list';
import type { QueryConfig } from '@/lib/react-query';

interface UseTierListOptions {
  name: string;
  queryConfig?: QueryConfig<typeof getTierListOptions>;
}

export function useTierList(_opts: UseTierListOptions) {
  const dummy: TierList = {
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

  return {
    isLoading: true,
    data: {
      data: {
        type: 'tierlist',
        success: true,
        tier_list: dummy,
      },
    },
  };
}

export function getTierListOptions(twitchId: string) {
  return queryOptions({
    queryKey: ['tierlist', twitchId],
    queryFn: () => {
      return null;
    },
  });
}
