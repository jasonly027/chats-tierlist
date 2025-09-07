import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

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
  pgm.createExtension('pgcrypto');

  pgm.createTable('users', {
    id: 'id',
    twitch_id: {
      type: 'TEXT',
      notNull: true,
      unique: true,
    },
    access_token: {
      type: 'BYTEA',
    },
    refresh_token: {
      type: 'BYTEA',
    },
    last_validate: {
      type: 'TIMESTAMPTZ',
      notNull: true,
    },
  });

  pgm.createTable('tierlists', {
    id: 'id',
    user_id: {
      type: 'INT',
      references: 'users(id)',
      notNull: true,
      onDelete: 'CASCADE',
    },
    data: {
      type: 'TEXT',
      notNull: true,
    },
  });
}
