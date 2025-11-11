import type { TierListDto } from '@/features/tierlist/types/tier-list';

export type SocketMessage =
  | {
      type: 'channel';
      channel: ChannelDto;
    }
  | {
      type: 'tierlist';
      tier_list: TierListDto;
    }
  | {
      type: 'listen';
      status: 'ok' | 'full' | 'error';
    }
  | {
      type: 'error';
      kind: 'missingChannel' | 'missingUser';
    };

export type ChannelDto = {
  id: string;
  broadcaster_login: string;
  display_name: string;
  is_live: boolean;
  thumbnail_url: string;
};
