import { expect } from 'chai';
import { nanoid } from 'nanoid';
import { runner as migration_runner } from 'node-pg-migrate';
import { Client } from 'pg';

import type { TierList } from '@/modules/tierlist/tierlist.types';
import { Repository } from '@/shared/db/repository';

describe('Repository', function () {
  let client: Client;
  let repo: Repository;

  before(async () => {
    client = new Client({
      connectionString: 'postgres://postgres:password@localhost:5433/postgres',
    });
    try {
      await client.connect();
    } catch (err) {
      console.error('Ensure test database is running "npm run dev:dbup"');
      throw err;
    }
    await migration_runner({
      dbClient: client,
      migrationsTable: 'migrations',
      dir: 'migrations',
      direction: 'up',
    });

    repo = new Repository(client);
  });

  beforeEach(async () => {
    await client.query('BEGIN');
  });
  afterEach(async () => {
    await client.query('ROLLBACK');
  });
  after(async () => {
    await client.end();
  });

  describe('createUserIfNotExists', function () {
    it('it should create user', async function () {
      const twitchId = 'twitchId';
      await repo.createUserIfNotExists(twitchId);
      const actual = (
        await client.query(`SELECT twitch_id FROM users WHERE twitch_id = $1`, [
          twitchId,
        ])
      ).rows;

      expect(actual).to.deep.equal([{ twitch_id: twitchId }]);
    });

    it('it should do nothing if user already exists', async function () {
      const twitchId = 'twitchId';
      await repo.createUserIfNotExists(twitchId);
      const expected = (
        await client.query(`SELECT * FROM users WHERE twitch_id = $1`, [
          twitchId,
        ])
      ).rows;

      // Add user again
      await repo.createUserIfNotExists(twitchId);
      const actual = (
        await client.query(`SELECT * FROM users WHERE twitch_id = $1`, [
          twitchId,
        ])
      ).rows;

      expect(actual).to.deep.equal(expected);
    });
  });

  describe('getUser', function () {
    it('should return correct user', async function () {
      const twitchId = 'twitchId';
      await client.query(`INSERT INTO users (twitch_id) VALUES ($1)`, [
        twitchId,
      ]);

      const user = await repo.getUser(twitchId);

      expect(user).to.have.all.keys('id', 'twitch_id');
      expect(user?.id).to.be.a('number');
      expect(user?.twitch_id).to.be.a('string').and.equal(twitchId);
    });

    it('should return undefined when no matching user', async function () {
      const user = await repo.getUser('twitchId');
      expect(user).to.equal(undefined);
    });
  });

  function createEmptyTierList(): TierList {
    return {
      tiers: [],
      items: {},
      isVoting: false,
      focus: null,
      version: Date.now(),
    };
  }

  describe('getTierList', function () {
    it('should return tier list', async function () {
      const twitchId = 'twitchId';
      const expected = createEmptyTierList();
      await client.query(
        `INSERT INTO users (twitch_id, tier_list) VALUES ($1, $2)`,
        [twitchId, expected]
      );

      const actual = await repo.getTierList(twitchId);

      expect(actual).to.deep.equal(expected);
    });

    it('should return undefined when tier_list column is null', async function () {
      const twitchId = 'twitchId';
      await client.query(`INSERT INTO users (twitch_id) VALUES ($1)`, [
        twitchId,
      ]);

      const actual = await repo.getTierList(twitchId);

      expect(actual).to.be.equal(undefined);
    });

    it('should return undefined when user does not exist', async function () {
      const actual = await repo.getTierList('twitchId');
      expect(actual).to.be.equal(undefined);
    });
  });

  describe('setTierList', function () {
    it('should update the tier list of a user', async function () {
      const twitchId = 'twitchId';
      const tierList = createEmptyTierList();
      await client.query(
        ` INSERT INTO users (twitch_id, tier_list) VALUES ($1, $2) `,
        [twitchId, JSON.stringify(tierList)]
      );

      tierList.tiers.push({ id: nanoid(), name: '', color: 'red' });
      await repo.setTierList(twitchId, tierList);

      const expected = JSON.stringify(tierList);
      const actual = (
        await client.query(`SELECT tier_list FROM users WHERE twitch_id = $1`, [
          twitchId,
        ])
      ).rows;
      expect(actual).to.deep.equal([{ tier_list: expected }]);
    });

    it('should do nothing if user does not exist', async function () {
      await repo.setTierList('twitchId', createEmptyTierList());

      const actual = (await client.query(`SELECT * FROM users`)).rows;
      expect(actual).to.be.empty;
    });
  });
});
