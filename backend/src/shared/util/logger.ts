import { AxiosError } from 'axios';
import pino, { stdSerializers } from 'pino';

import { env } from '@/config';

const baseLogger = pino({
  level: env.LOG_LEVEL,
  serializers: {
    err(err) {
      if (err instanceof AxiosError) {
        delete err.config?.httpAgent;
        delete err.config?.httpsAgent;
      }
      return stdSerializers.errWithCause(err as Error);
    },
  },
});

export default baseLogger;
