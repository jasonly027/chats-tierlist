import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { TwitchProfile } from '../types.ts';

interface TwitchClientOptions {
  twitchHelixUrl?: string;
}

export class TwitchClient {
  private readonly twitchHelixUrl: string;
  private readonly clientId: string;
  private http: AxiosInstance;

  constructor(clientId: string, options?: TwitchClientOptions) {
    this.twitchHelixUrl =
      options?.twitchHelixUrl ?? 'https://api.twitch.tv/helix';
    this.clientId = clientId;

    this.http = axios.create({
      headers: {
        ['Client-Id']: this.clientId,
      },
    });
  }

  async validate(accessToken: string): Promise<AxiosResponse> {
    return this.http.get('https://id.twitch.tv/oauth2/validate', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async revoke(accessToken: string): Promise<AxiosResponse> {
    const params = new URLSearchParams({
      ['client_id']: this.clientId,
      token: accessToken,
    });
    return this.http.post('https://id.twitch.tv/oauth2/revoke', params);
  }

  async getUser(accessToken: string): Promise<TwitchProfile> {
    return this.http
      .get(`${this.twitchHelixUrl}/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((resp) => {
        if (resp.status === 200) {
          return resp;
        }
        throw new Error(
          `Failed to fetch user ${resp.status}: ${resp.statusText}`
        );
      })
      .then((resp) => {
        return resp.data.data[0];
      });
  }
}
