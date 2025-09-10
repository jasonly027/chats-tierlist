export interface TierListTier {
  name: string;
  color: string;
}

export interface TierListItem {
  name: string;
  votes: number[];
  imageUrl: string | null;
}
