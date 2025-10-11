import createClient, { type Middleware } from 'openapi-fetch';

import { env } from '@/config/env';
import type { paths } from '@/types/dto';

export const api = createClient<paths>({
  baseUrl: env.BACKEND_URL,
  credentials: 'include',
});

const throwMiddleware: Middleware = {
  async onResponse({ request, response }) {
    if (!response.ok) {
      const data = (await response
        .clone()
        .json()
        .catch(() => null)) as unknown;
      throw new FetchError({ request, response, data });
    }
  },
};

api.use(throwMiddleware);

export class FetchError extends Error {
  override name = 'FetchError';
  request: Request;
  response: Response;
  config: RequestInit & { url?: string };
  data: unknown;

  constructor({
    request,
    response,
    data,
  }: {
    request: Request;
    response: Response;
    data: unknown;
  }) {
    super(`Request failed with status code ${response.status}`);

    this.request = request;
    this.response = response;
    this.config = {
      url: request.url,
      method: request.method,
      headers: request.headers,
    };
    this.data = data;
  }
}
