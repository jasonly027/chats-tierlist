import { readFileSync } from 'fs';

import { Type as T } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const schema = T.Object({
  NODE_ENV: T.Enum({
    development: 'development',
    production: 'production',
  }),
  LOG_LEVEL: T.Enum({
    error: 'error',
    warn: 'warn',
    info: 'info',
    debug: 'debug',
  }),
  HOST: T.String({ default: 'localhost' }),
  PORT: T.Number({ default: 3000 }),

  DATABASE_URL: T.String(),
  REDIS_URL: T.String(),

  TWITCH_CLIENT_ID: T.String(),
  TWITCH_CLIENT_SECRET: T.String(),
  TWITCH_REFRESH_TOKEN: T.String(),

  // For Auth
  TWITCH_CALLBACK_URL: T.String(),
  LOGIN_REDIRECT_URL: T.String(),
  COOKIE_DOMAIN: T.String(),
  SESSION_SECRET: T.String(),
});

const envVars = Object.entries(process.env).reduce<
  Record<string, string | undefined>
>((acc, curr) => {
  const [key, value] = curr as [string, string];

  if (key in schema.properties) {
    acc[key] = value;
  } else if (key.endsWith('_FILE')) {
    const strippedKey = key.slice(0, -5);
    if (strippedKey in schema.properties) {
      try {
        acc[strippedKey] = readFileSync(value, 'utf8').trim();
      } catch (cause) {
        throw Error(`Failed to read file for ${key}: ${value}`, { cause });
      }
    }
  }

  return acc;
}, {});

export default Value.Parse(schema, envVars);
