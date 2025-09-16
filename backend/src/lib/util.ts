import { AxiosError } from 'axios';
import fs from 'fs';
import pino, { stdSerializers } from 'pino';

export function envVar(key: string): string {
  if (process.env[key]) {
    return process.env[key]!;
  }

  const fileEnvKey = `${key}_FILE`;
  if (process.env[fileEnvKey]) {
    try {
      return fs.readFileSync(process.env[fileEnvKey]!, 'utf8').trim();
    } catch (err) {
      console.error(`Failed to read file for ${fileEnvKey}:`, err);
    }
  }

  console.error(`Neither ${key} or ${key}_FILE was set`);
  process.exit(1);
}

export const baseLogger = pino({
  level: 'debug',
  serializers: {
    err(err) {
      if (err instanceof AxiosError) {
        delete err.config?.httpAgent;
        delete err.config?.httpsAgent;
      }
      return stdSerializers.errWithCause(err);
    },
  },
});
