import type { Channel } from "@lib/twitch/models.js";

export interface TierList {
  tiers: Record<string, TierListTier>;
  items: Record<string, TierListItem>;
}

export interface TierListTier {
  color: string;
}

export interface TierListItem {
  imageUrl: string | null;
  votes: Record<string, string>;
}

export interface TierListStore {
  getSchema(channel: Channel): void;
}
