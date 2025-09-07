export interface TwitchProfile {
  id: string;
  login: string;
  displayName: string;
  profile_image_url: string;
  [key: string]: unknown;
}

export interface UserProfile {
  id: string;
  name: string;
  profile_image_url: string;
}
