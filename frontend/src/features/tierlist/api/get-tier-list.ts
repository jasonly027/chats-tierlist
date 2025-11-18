import { QueryClient, queryOptions, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { env } from '@/config/env';
import type {
  Item,
  TieredItem,
  TierList,
  TierListDto,
  TierListRequest,
} from '@/features/tierlist/types/tier-list';
import type {
  ChannelDto,
  SocketMessage,
} from '@/features/tierlist/types/websocket';
import { queryClient, type QueryConfig } from '@/lib/react-query';
import type { User } from '@/types/api';

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
    queryFn: () => listener.getInitial(name),
    retry: false,
  });
}

export type ServerData = {
  tierList: TierList;
  channel: User;
  error: Extract<SocketMessage, { type: 'error' }>['kind'];
};

class Listener {
  private name_?: string;
  private socket_?: WebSocket;
  private closeHandler?: (ev: WebSocketEventMap['close']) => void | null;

  private client_: QueryClient;
  private waiting_: {
    resolve: (arg?: never) => void;
    reject: (reason: Error) => void;
  }[] = [];

  constructor(client: QueryClient) {
    this.client_ = client;
  }

  async getInitial(name: string): Promise<Partial<ServerData>> {
    if (name !== this.name_) {
      this.init(name);
    }

    // Wait for server data if channel and tier list
    // haven't been set, unless error has already been set.
    const initial = this.getData();
    if ((initial.channel && initial.tierList) || initial?.error) {
      return initial;
    } else {
      await new Promise((resolve, reject) =>
        this.waiting_.push({ resolve, reject })
      );
    }
    return this.getData();
  }

  private init(name: string) {
    this.name_ = name;
    this.reset();
    this.connect();
  }

  private connect() {
    this.socket_ = new WebSocket(`${env.BACKEND_URL}/tierlist/${this.name_}`);

    this.closeHandler = ({ code, reason }) => {
      console.log('Socket closed', code, reason);

      this.handleWaiting(
        new Error(`Socket closed before getting initial context: ${reason}`)
      );

      toast.error('Socket closed. Please refresh...', { duration: Infinity });
    };
    this.socket_.addEventListener('close', this.closeHandler);

    this.socket_.addEventListener('error', () => {
      toast.error('Socket Error...');
    });

    this.setSocketState('channel');
  }

  private setSocketState(state: 'channel' | 'update') {
    if (!this.socket_) return;

    // Expecting channel info as the first message
    if (state === 'channel') {
      this.socket_.onmessage = ({ data }: MessageEvent<string>) => {
        const msg = JSON.parse(data) as SocketMessage;

        if (msg.type === 'channel') {
          this.setData((prev) => ({
            ...prev,
            channel: dtoToUser(msg.channel),
          }));

          this.setSocketState('update');
        } else if (msg.type === 'error') {
          this.setData((prev) => ({
            ...prev,
            error: msg.kind,
          }));

          this.handleWaiting('ok');
          if (this.closeHandler) {
            this.socket_?.removeEventListener('close', this.closeHandler);
          }
        } else {
          console.error('Unexpected socket message', msg);
        }
      };
    } else if (state === 'update') {
      this.socket_.onmessage = ({ data }: MessageEvent<string>) => {
        const msg = JSON.parse(data) as SocketMessage;

        if (msg.type === 'tierlist') {
          const newTierList = dtoToTierList(msg.tier_list);
          const currentData = this.getData();

          // Ignore in-transit updates before a schema change
          if (
            currentData.tierList === undefined ||
            newTierList.version >= currentData.tierList.version
          ) {
            this.setData((prev) => ({
              ...prev,
              tierList: newTierList,
            }));
            this.handleWaiting('ok');
          } else {
            console.log(
              'Received stale',
              currentData.tierList.version,
              newTierList.version
            );
          }
        } else if (msg.type === 'listen') {
          if (msg.status === 'full') {
            toast.error('Cannot read chat, too many listeners...');
          } else if (msg.status === 'error') {
            toast.error('Failed to read chat...');
          }
        } else {
          console.error('Unexpected socket message', msg);
        }
      };
    }
  }

  private getData() {
    if (!this.name_) return {};
    return (
      this.client_.getQueryData(getTierListOptions(this.name_).queryKey) ?? {}
    );
  }

  private setData(
    updater: Parameters<
      typeof this.client_.setQueryData<
        Awaited<ReturnType<typeof this.getInitial>>
      >
    >[1]
  ) {
    if (!this.name_) return;
    this.client_.setQueryData(getTierListOptions(this.name_).queryKey, updater);
  }

  private reset() {
    if (this.closeHandler) {
      this.socket_?.removeEventListener('close', this.closeHandler);
    }
    this.socket_?.close(1000, 'Switching to different channel');
  }

  private handleWaiting(result: 'ok' | Error) {
    if (result === 'ok') {
      this.waiting_.forEach(({ resolve }) => resolve());
    } else {
      this.waiting_.forEach(({ reject }) => reject(result));
    }
    this.waiting_ = [];
  }
}

const listener = new Listener(queryClient);

function dtoToUser(dto: ChannelDto): User {
  return {
    twitchId: dto.id,
    name: dto.broadcaster_login,
    displayName: dto.display_name,
    imageUrl: dto.thumbnail_url,
  };
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
    acc[name] = {};
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
