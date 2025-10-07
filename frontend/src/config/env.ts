import { Type as T } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

function createEnv() {
  const EnvSchema = T.Object({
    LOGIN_URL: T.String(),
  });

  const envVars = Object.entries(import.meta.env).reduce<
    Record<string, string>
  >((acc, curr) => {
    const [key, value] = curr as [string, string];
    if (key.startsWith('VITE_APP_')) {
      acc[key.replace('VITE_APP_', '')] = value;
    }
    return acc;
  }, {});

  const isValid = Value.Check(EnvSchema, envVars);
  if (!isValid) {
    const errors = [...Value.Errors(EnvSchema, envVars)];
    const prettyErrors = JSON.stringify(errors, null, 2);
    throw new Error(
      `Invalid env provided\nNote: Variables should be prefixed with VITE_APP_\n\nErrors: ${prettyErrors}`
    );
  }

  return envVars;
}

export const env = createEnv();
