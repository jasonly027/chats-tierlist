import * as pg from 'pg';
import * as model from '@lib/db/models.js';

export class Repository {
  private readonly pool: pg.Pool;

  constructor(pool: pg.Pool) {
    this.pool = pool;
  }

  async createUserIfNotExists(twitch_id: string): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO users (twitch_id) 
      VALUES ($1)
      ON CONFLICT (twitch_id) DO NOTHING
      `,
      [twitch_id]
    );
  }

  async getUser(twitch_id: string): Promise<model.User | null> {
    const res = await this.pool.query<_User>(
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
    );
    const rawUser = res.rows[0];
    if (!rawUser) return null;

    return mapRawUser(rawUser);
  }
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
