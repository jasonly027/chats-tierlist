export interface TierList {
  tiers: TierListTier[];
  items: Record<string, TierListItem>;
  isVoting: boolean;
  focus: string | null;
  version: number;
}

export interface TierListTier {
  name: string;
  color: string;
}

export interface TierListItem {
  imageUrl: string | null;
  votes: Record<string, number>;
}
