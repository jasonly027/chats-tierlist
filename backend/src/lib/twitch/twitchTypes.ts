// https://dev.twitch.tv/docs/api/reference/#get-users
export interface User {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  [key: string]: unknown;
}

// https://dev.twitch.tv/docs/api/reference/#search-channels
export interface SearchChannel {
  id: string;
  display_name: string;
  is_live: boolean;
  [key: string]: unknown;
}
