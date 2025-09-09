// From Twitch OAuth2.
export interface TwitchProfile {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  [key: string]: unknown;
}

// User data in session store.
export interface SessionProfile {
  twitch_id: string;
  name: string;
  profileImageUrl: string;
}

export interface TierListTier {
  name: string;
  color: string;
}

export interface TierListItem {
  name: string;
  votes: number[];
  imageUrl: string | null;
}
