import Axios, { AxiosError, type AxiosRequestConfig } from 'axios';

import { env } from '@/config/env';

export const AXIOS_INSTANCE = Axios.create({ baseURL: env.BACKEND_URL });

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    withCredentials: true,
    ...config,
    ...options,
    cancelToken: source.token,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  }).then(({ data }) => data);

  // @ts-expect-error Expected by Orval
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export type ErrorType<Error> = AxiosError<Error>;

export type BodyType<BodyData> = BodyData;
