import { AxiosError } from 'axios';
import pino, { stdSerializers } from 'pino';

const baseLogger = pino({
  level: 'debug',
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
