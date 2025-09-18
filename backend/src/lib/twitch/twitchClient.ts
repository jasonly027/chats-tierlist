import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import * as tw from './types/api.js';
import { HttpAgent, HttpsAgent } from 'agentkeepalive';

interface TwitchClientOptions {
  clientId: string;
  clientSecret: string;
  helixUrl?: string;
  oauthUrl?: string;
}

export class TwitchClient {
  private readonly helixUrl: string;
  private readonly oauthUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private http: AxiosInstance;

  constructor(options: TwitchClientOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.helixUrl = options.helixUrl ?? 'https://api.twitch.tv/helix';
    this.oauthUrl = options.oauthUrl ?? 'https://id.twitch.tv/oauth2';

    this.http = axios.create({
      headers: {
        ['Client-Id']: this.clientId,
      },
      httpAgent: new HttpAgent(),
      httpsAgent: new HttpsAgent(),
    });
  }

  validate(token: string): Promise<AxiosResponse> {
    return this.http.get(`${this.oauthUrl}/validate`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  refresh(token: string): Promise<tw.Refresh> {
    return this.http
      .post(
        `${this.oauthUrl}/token`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: token,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
      .then((res) => {
        return tw.RefreshSchema.parse(res.data);
      });
  }

  revoke(token: string): Promise<AxiosResponse> {
    return this.http.post(
      `${this.oauthUrl}/revoke`,
      {
        client_id: this.clientId,
        token: token,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }

  userFromToken(token: string): Promise<tw.User> {
    return this.http
      .get(`${this.helixUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((resp) => {
        const users = tw.UserResponseSchema.parse(resp.data);
        return users.data[0]!;
      });
  }

  searchChannel(
    token: string,
    query: string
  ): Promise<tw.SearchChannel | null> {
    return this.http
      .get(`${this.helixUrl}/search/channels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          query,
          first: 1,
        },
      })
      .then((resp) => {
        const channels = tw.SearchChannelResponseSchema.parse(resp.data);

        const name = query.toLowerCase();
        const channel = channels.data[0];
        if (
          name === channel?.broadcaster_login ||
          name === channel?.display_name
        ) {
          return channel;
        }
        return null;
      });
  }

  subscriptions(
    token: string,
    status?: 'enabled'
  ): Promise<tw.SubscriptionsResponse> {
    const params: Record<string, string> = {};
    if (status !== undefined) params['status'] = status;

    return this.http
      .get(`${this.helixUrl}/eventsub/subscriptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      })
      .then((resp) => {
        return tw.SubscriptionsResponseSchema.parse(resp.data);
      });
  }

  createChatMessageSubscription(
    token: string,
    options: { sessionId: string; broadcasterId: string; userId: string }
  ): Promise<tw.Subscription> {
    return this.http
      .post(
        `${this.helixUrl}/eventsub/subscriptions`,
        {
          type: 'channel.chat.message',
          version: '1',
          condition: {
            broadcaster_user_id: options.broadcasterId,
            user_id: options.userId,
          },
          transport: {
            method: 'websocket',
            session_id: options.sessionId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((resp) => {
        return tw.SubscriptionSchema.parse(resp.data?.data?.[0]);
      });
  }

  deleteChatMessageSubscription(
    token: string,
    subscriptionId: string
  ): Promise<AxiosResponse> {
    return this.http.delete(`${this.helixUrl}/eventsub/subscriptions`, {
      params: {
        id: subscriptionId,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
