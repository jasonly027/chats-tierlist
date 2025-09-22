import * as pg from 'pg';
import * as model from '@lib/db/models.js';
import type { TierList } from '@lib/tierlist/models.js';

export class Repository {
  private readonly db: pg.Pool | pg.Client;

  constructor(db: pg.Pool | pg.Client) {
    this.db = db;
  }

  async createUserIfNotExists(twitch_id: string): Promise<void> {
    await this.db
      .query(
        `
      INSERT INTO users (twitch_id) 
      VALUES ($1)
      ON CONFLICT (twitch_id) DO NOTHING
      `,
        [twitch_id]
      )
      .catch(throwAsRepositoryError('failed to create user'));
  }

  async getUser(twitch_id: string): Promise<model.User | undefined> {
    return this.db
      .query<model.User>(
        `
      SELECT
        id,
        twitch_id,
        voting
      FROM users
      WHERE twitch_id = $1
      `,
        [twitch_id]
      )
      .then((res) => {
        return res.rows[0];
      })
      .catch(throwAsRepositoryError('failed to get user'));
  }

  async getTierList(twitch_id: string): Promise<TierList | undefined> {
    return await this.db
      .query<{ tier_list: string }>(
        `
      SELECT tier_list
      FROM users
      WHERE twitch_id = $1
      `,
        [twitch_id]
      )
      .then((res) => {
        const serializedTierList = res.rows[0]?.tier_list;
        if (!serializedTierList) return undefined;
        return JSON.parse(serializedTierList);
      });
  }

  async setTierList(twitch_id: string, tierList: TierList): Promise<void> {
    const serializedTierList = JSON.stringify(tierList);
    await this.db
      .query(
        `
      UPDATE users
      SET tier_list = $1
      WHERE twitch_id = $2
      `,
        [serializedTierList, twitch_id]
      )
      .catch(throwAsRepositoryError('setting tier list'));
  }
}

class RepositoryError extends Error {
  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'RepositoryError';
    this.cause = cause;
  }
}

// Convenience function to pass to catch.
function throwAsRepositoryError(message: string) {
  return (cause: unknown): PromiseLike<never> => {
    throw new RepositoryError(message, cause);
  };
}
