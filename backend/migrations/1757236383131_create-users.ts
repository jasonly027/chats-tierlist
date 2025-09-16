import { type ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = {
  id: {
    type: 'INT',
    primaryKey: true,
    sequenceGenerated: {
      precedence: 'ALWAYS',
    },
  },
};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('users', {
    id: 'id',
    twitch_id: {
      type: 'TEXT',
      notNull: true,
      unique: true,
    },
    voting: {
      type: 'BOOLEAN',
      notNull: true,
      default: false,
    },
    tiers: {
      type: 'TEXT[]',
      check: 'array_length(tiers, 1) <= 50',
    },
    items: {
      type: 'TEXT[]',
      check: 'array_length(items, 1) <= 500',
    },
  });
}
