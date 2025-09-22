import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as tw from './types/api.js';
import { HttpAgent, HttpsAgent } from 'agentkeepalive';
import { baseLogger } from '@lib/util.js';

const logger = baseLogger.child({ module: 'TwitchClient' });

export interface TwitchClientOptions {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  helixUrl?: string;
  oauthUrl?: string;
}

export class TwitchClient {
  private readonly helixUrl: string;
  private readonly oauthUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken!: string;
  private refreshToken: string;
  private userId!: string;
  private http: AxiosInstance;

  static async create(options: TwitchClientOptions): Promise<TwitchClient> {
    const client = new TwitchClient(options);
    client.accessToken = (await client.refresh()).access_token;
    client.userId = (await client.userFromToken()).id;
    return client;
  }

  private constructor(options: TwitchClientOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.refreshToken = options.refreshToken;
    this.helixUrl = options.helixUrl ?? 'https://api.twitch.tv/helix';
    this.oauthUrl = options.oauthUrl ?? 'https://id.twitch.tv/oauth2';

    this.http = axios.create({
      headers: {
        ['Client-Id']: this.clientId,
      },
      httpAgent: new HttpAgent(),
      httpsAgent: new HttpsAgent(),
    });
    this.attachRefreshInterceptor();
  }

  private attachRefreshInterceptor(): void {
    this.http.interceptors.response.use(
      (res) => res,
      (err) => {
        if (!(err instanceof AxiosError) || err.config === undefined) {
          return Promise.reject(err);
        }
        const config: AxiosRequestConfigWithRefresh = err.config;
        if (err.response?.status !== 401 || config.skipRefresh) {
          return Promise.reject(err);
        }

        logger.info('Access token expired. Attempting refresh into retry.');
        config.skipRefresh = true;
        return this.refresh()
          .then((res) => {
            this.accessToken = res.access_token;
            this.refreshToken = res.refresh_token;

            config.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.http(config);
          })
          .catch((err2) => {
            logger.error({ err: err2 }, 'Failed while refreshing into retry');
            return Promise.reject(err2);
          });
      }
    );
  }

  validate(): Promise<AxiosResponse> {
    return this.http.get(`${this.oauthUrl}/validate`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  refresh(): Promise<tw.Refresh> {
    return this.http
      .post(
        `${this.oauthUrl}/token`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
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

  revoke(): Promise<AxiosResponse> {
    return this.http.post(
      `${this.oauthUrl}/revoke`,
      {
        client_id: this.clientId,
        token: this.accessToken,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }

  userFromToken(): Promise<tw.User> {
    return this.http
      .get(`${this.helixUrl}/users`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })
      .then((resp) => {
        const users = tw.UserResponseSchema.parse(resp.data);
        return users.data[0]!;
      });
  }

  searchChannel(query: string): Promise<tw.SearchChannel | null> {
    return this.http
      .get(`${this.helixUrl}/search/channels`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
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

  subscriptions(status?: 'enabled'): Promise<tw.SubscriptionsResponse> {
    const params: Record<string, string> = {};
    if (status !== undefined) params['status'] = status;

    return this.http
      .get(`${this.helixUrl}/eventsub/subscriptions`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params,
      })
      .then((resp) => {
        return tw.SubscriptionsResponseSchema.parse(resp.data);
      });
  }

  createChatMessageSubscription(options: {
    sessionId: string;
    broadcasterId: string;
  }): Promise<tw.Subscription> {
    return this.http
      .post(
        `${this.helixUrl}/eventsub/subscriptions`,
        {
          type: 'channel.chat.message',
          version: '1',
          condition: {
            broadcaster_user_id: options.broadcasterId,
            user_id: this.userId,
          },
          transport: {
            method: 'websocket',
            session_id: options.sessionId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )
      .then((resp) => {
        return tw.SubscriptionSchema.parse(resp.data?.data?.[0]);
      });
  }

  deleteChatMessageSubscription(
    subscriptionId: string
  ): Promise<AxiosResponse> {
    return this.http.delete(`${this.helixUrl}/eventsub/subscriptions`, {
      params: {
        id: subscriptionId,
      },
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }
}

interface AxiosRequestConfigWithRefresh extends InternalAxiosRequestConfig {
  skipRefresh?: boolean;
}
