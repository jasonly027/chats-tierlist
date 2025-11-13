import { Type as T } from 'typebox';

export function UrlSchema(options?: T.TStringOptions) {
  return T.String({ format: 'url', ...options });
}
