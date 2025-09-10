import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import * as tw from '@lib/twitch/twitchTypes.js';

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

  async validate(token: string): Promise<AxiosResponse> {
    return this.http.get('https://id.twitch.tv/oauth2/validate', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async revoke(token: string): Promise<AxiosResponse> {
    const params = new URLSearchParams({
      ['client_id']: this.clientId,
      token: token,
    });
    return this.http.post('https://id.twitch.tv/oauth2/revoke', params);
  }

  async userFromToken(token: string): Promise<tw.User> {
    return this.http
      .get(`${this.twitchHelixUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
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

  // async searchChannel(token: string, query: string): Promise<tw.SearchChannel> {
  //   const res = await this.http.get(`${this.twitchHelixUrl}/search/channels`, {
  //     params: {
  //       query,
  //       first: 1,
  //     },
  //   });

  //   // res.data
  // }
}
