import { Type as T } from 'typebox';

export function nullSchema(description: string): T.TNull {
  return T.Null({ description });
}
