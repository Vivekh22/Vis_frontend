/**
 * env.ts — config/
 *
 * Purpose:
 *   Single, typed wrapper around Vite's import.meta.env. No repository or
 *   service should read import.meta.env directly — they all go through here,
 *   the same "one audited chokepoint" principle SafeHtml.ts and ApiClient.ts
 *   establish for their respective concerns.
 *
 *   Supports VITE_USE_MOCK_DATA so the app can run against repositories/mocks/
 *   for local development without a backend, while defaulting to real
 *   repositories otherwise. Both paths stay alive — mocks remain useful for
 *   isolated frontend development before the backend is ready.
 */
interface AppEnv {
  readonly apiBaseUrl: string;
  readonly useMockData: boolean;
}

function readEnv(key: string): string | undefined {
  // import.meta.env is statically replaced by Vite at build time.
  // The dynamic access pattern is safe because Vite only replaces keys
  // that start with VITE_ and are defined in the .env files.
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  return env[key];
}

function parseEnv(): AppEnv {
  const apiBaseUrl = readEnv('VITE_API_BASE_URL') ?? '/api';
  const useMockData = readEnv('VITE_USE_MOCK_DATA') === 'true';
  return { apiBaseUrl, useMockData };
}

const resolvedEnv: AppEnv = parseEnv();

export function getEnvVar(key: string): string | undefined {
  return readEnv(key);
}

export function getApiBaseUrl(): string {
  return resolvedEnv.apiBaseUrl;
}

export function isMockMode(): boolean {
  return resolvedEnv.useMockData;
}