import createClient from 'openapi-fetch';

import { env } from '@/config/env';
import type { paths } from '@/types/dto';

export const api = createClient<paths>({
  baseUrl: env.BACKEND_URL,
  credentials: 'include',
});
