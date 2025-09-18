import { baseLogger } from '@lib/util.js';
import type { TwitchClient } from './twitchClient.ts';
import { AxiosError } from 'axios';

const logger = baseLogger.child({ module: 'TwitchTokenStore' });

export class TwitchTokenStore {
  private readonly client: TwitchClient;
  private refreshToken: string;
  private accessToken: Promise<string>;
  private validateIntervalId: NodeJS.Timeout | undefined;

  constructor(client: TwitchClient, refreshToken: string) {
    this.client = client;
    this.refreshToken = refreshToken;
    this.accessToken = this.client
      .refresh(refreshToken)
      .then((res) => res.access_token)
      .catch((cause) => {
        throw new Error('Initial token refresh failed', { cause });
      });
    this.startValidateInterval();
  }

  /**
   * Validates the token before returning it. If the token is invalid,
   * refreshing it is attempted. If the refresh was successful, the new token
   * is returned, otherwise the invalid token is returned.
   */
  async getToken(): Promise<string> {
    try {
      await this.client.validate(await this.accessToken);
    } catch (err) {
      if (err instanceof AxiosError && err.status === 401) {
        logger.info('Refreshing token');

        this.accessToken = this.client
          .refresh(this.refreshToken)
          .then((res) => res.access_token)
          .catch((err) => {
            logger.error({ err }, 'Failed to refresh token');
            return this.accessToken;
          });
      }
      logger.error({ err }, 'Failed to validate token');
    }

    return this.accessToken;
  }

  startValidateInterval(): void {
    const VALIDATE_INTERVAL = 60 * 60 * 1000;

    this.stopValidateInterval();
    this.validateIntervalId = setInterval(async () => {
      logger.info('Validating token');
      this.getToken();
    }, VALIDATE_INTERVAL);
  }

  stopValidateInterval(): void {
    clearInterval(this.validateIntervalId);
    this.validateIntervalId = undefined;
  }
}
