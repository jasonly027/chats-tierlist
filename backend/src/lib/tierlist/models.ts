export interface TierList {
  tiers: TierListTier[];
  items: Record<string, TierListItem>;
  isLocked: boolean;
}

export interface TierListTier {
  name: string;
  color: string;
}

export interface TierListItem {
  imageUrl: string | undefined;
  votes: Record<string, number>;
}
