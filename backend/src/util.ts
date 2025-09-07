import fs from 'fs';

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
