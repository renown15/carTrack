import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from project root (two levels up from apps/server)
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../../../.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      const value = rest.join('=').trim();
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional — use real environment variables
  }
}

loadEnv();

if (!process.env.PORT) throw new Error('PORT is not set — copy .env.example to .env');

export const config = {
  port: Number(process.env.PORT),
  tomtomApiKey: process.env.TOMTOM_API_KEY ?? '',
  dbPath: resolve(__dirname, '../../..', 'data', 'cartrack.db'),
} as const;
