import * as pg from 'pg';
import * as model from '@lib/db/models.js';

export class Repository {
  private readonly pool: pg.Pool;

  constructor(pool: pg.Pool) {
    this.pool = pool;
  }

  async createUserIfNotExists(twitch_id: string): Promise<void> {
    await this.pool
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

  async getUser(twitch_id: string): Promise<model.User | null> {
    return this.pool
      .query<_User>(
        `
      SELECT
        id,
        twitch_id,
        voting,
        tiers,
        items
      FROM users
      WHERE twitch_id = $1
      `,
        [twitch_id]
      )
      .then((res) => {
        return res.rows[0] ? mapRawUser(res.rows[0]) : null;
      })
      .catch(throwAsRepositoryError('failed to get user'));
  }
}

// A wrapper for database errors so Fastify's default error handler doesn't
// expose internal database error messages on err.message.
class RepositoryError extends Error {
  // @ts-expect-error field is included in logs. We use this.internal
  // instead of this.cause because the latter strips data.
  private readonly internal: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'RepositoryError';
    this.internal = cause;
  }
}

// Convenience function to pass to catch.
function throwAsRepositoryError(message: string) {
  return (cause: unknown): PromiseLike<never> => {
    throw new RepositoryError(message, cause);
  };
}

interface _User {
  id: number;
  twitch_id: string;
  voting: boolean;
  tiers: string[] | null;
  items: string[] | null;
}

// function mapUser(user: model.User): _User {
//   const tiers =
//     user.tiers.length !== 0
//       ? user.tiers.map((tier) => JSON.stringify(tier))
//       : null;
//   const items =
//     user.tiers.length !== 0
//       ? user.items.map((item) => JSON.stringify(item))
//       : null;

//   return {
//     id: user.id,
//     twitch_id: user.twitch_id,
//     voting: user.voting,
//     tiers,
//     items,
//   };
// }

function mapRawUser(raw: _User): model.User {
  return {
    id: raw.id,
    twitch_id: raw.twitch_id,
    voting: raw.voting,
    tiers: raw.tiers?.map((tier) => JSON.parse(tier)) ?? [],
    items: raw.items?.map((item) => JSON.parse(item)) ?? [],
  };
}
