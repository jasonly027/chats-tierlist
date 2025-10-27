import { Type as T } from 'typebox';

export function TextSchema(options?: T.TStringOptions) {
  return T.String({ minLength: 1, maxLength: 255, ...options });
}
