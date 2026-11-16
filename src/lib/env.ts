/**
 * Typed, validated configuration.
 *
 * Two groups, deliberately separate:
 *  - getConfig(): non-secret settings used to render pages and build checkout
 *    parameters. Read at build time for static pages.
 *  - getStripeSecretKey() / getStripeWebhookSecret(): secrets, read lazily at
 *    request time so a build never needs them.
 *
 * Every problem is collected and reported together, so a misconfigured
 * deployment fails once with the full list instead of one variable at a time.
 */

export class ConfigError extends Error {
  constructor(public readonly problems: readonly string[]) {
    super(`Invalid configuration:\n - ${problems.join('\n - ')}`);
    this.name = 'ConfigError';
  }
}

/** Currencies with two decimal places. PRICE_CENTS is only meaningful for these. */
export const SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'cad', 'aud'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export interface AppConfig {
  /** Canonical origin, no trailing slash, e.g. https://example.com */
  readonly appUrl: string;
  readonly priceCents: number;
  readonly currency: Currency;
  /** ISO calendar date (YYYY-MM-DD). The delivery promise made to buyers. */
  readonly shipByDate: string;
  /** Kill switch. When false, checkout is refused and the buy button is hidden. */
  readonly preordersOpen: boolean;
  readonly supportEmail: string;
  readonly legalEntityName: string;
  /** Requires Stripe Tax to be configured in the Stripe account. */
  readonly automaticTax: boolean;
}

type Env = Readonly<Record<string, string | undefined>>;

const MIN_PRICE_CENTS = 100;
const MAX_PRICE_CENTS = 100_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function read(env: Env, key: string): string | undefined {
  const value = env[key]?.trim();
  return value === undefined || value === '' ? undefined : value;
}

function parseBoolean(
  env: Env,
  key: string,
  fallback: boolean,
  problems: string[],
): boolean {
  const raw = read(env, key);
  if (raw === undefined) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  problems.push(`${key} must be "true" or "false"`);
  return fallback;
}

function parseAppUrl(env: Env, problems: string[]): string {
  const raw = read(env, 'APP_URL');
  if (raw === undefined) {
    problems.push('APP_URL is required (e.g. https://example.com)');
    return '';
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    problems.push('APP_URL must be an absolute URL');
    return '';
  }
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) {
    problems.push('APP_URL must use https (http is allowed only for localhost)');
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    problems.push('APP_URL must be an origin only, with no path, query or hash');
  }
  return url.origin;
}

function parsePriceCents(env: Env, problems: string[]): number {
  const raw = read(env, 'PRICE_CENTS') ?? '1900';
  if (!/^\d+$/.test(raw)) {
    problems.push('PRICE_CENTS must be a whole number of cents');
    return 0;
  }
  const value = Number(raw);
  if (value < MIN_PRICE_CENTS || value > MAX_PRICE_CENTS) {
    problems.push(
      `PRICE_CENTS must be between ${MIN_PRICE_CENTS} and ${MAX_PRICE_CENTS}`,
    );
  }
  return value;
}

function parseCurrency(env: Env, problems: string[]): Currency {
  const raw = (read(env, 'PRICE_CURRENCY') ?? 'usd').toLowerCase();
  const match = SUPPORTED_CURRENCIES.find((c) => c === raw);
  if (match === undefined) {
    problems.push(
      `PRICE_CURRENCY must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
    );
    return 'usd';
  }
  return match;
}

function parseShipByDate(env: Env, problems: string[]): string {
  const raw = read(env, 'SHIP_BY_DATE');
  if (raw === undefined) {
    problems.push('SHIP_BY_DATE is required (YYYY-MM-DD)');
    return '';
  }
  const parsed = new Date(`${raw}T00:00:00Z`);
  const isRealDate =
    ISO_DATE_PATTERN.test(raw) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === raw;
  if (!isRealDate) {
    problems.push('SHIP_BY_DATE must be a real calendar date in YYYY-MM-DD form');
  }
  return raw;
}

function parseSupportEmail(env: Env, problems: string[]): string {
  const raw = read(env, 'SUPPORT_EMAIL');
  if (raw === undefined) {
    problems.push('SUPPORT_EMAIL is required');
    return '';
  }
  if (!EMAIL_PATTERN.test(raw)) problems.push('SUPPORT_EMAIL must be an email address');
  return raw;
}

function parseLegalEntityName(env: Env, problems: string[]): string {
  const raw = read(env, 'LEGAL_ENTITY_NAME');
  if (raw === undefined) {
    problems.push('LEGAL_ENTITY_NAME is required (the seller named in the terms)');
    return '';
  }
  if (raw.length > 120) problems.push('LEGAL_ENTITY_NAME must be 120 characters or fewer');
  return raw;
}

/** Pure parser. Exported for tests; application code should call getConfig(). */
export function parseConfig(env: Env): AppConfig {
  const problems: string[] = [];
  const config: AppConfig = {
    appUrl: parseAppUrl(env, problems),
    priceCents: parsePriceCents(env, problems),
    currency: parseCurrency(env, problems),
    shipByDate: parseShipByDate(env, problems),
    preordersOpen: parseBoolean(env, 'PREORDERS_OPEN', true, problems),
    supportEmail: parseSupportEmail(env, problems),
    legalEntityName: parseLegalEntityName(env, problems),
    automaticTax: parseBoolean(env, 'STRIPE_AUTOMATIC_TAX', false, problems),
  };
  if (problems.length > 0) throw new ConfigError(problems);
  return config;
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  cached ??= parseConfig(process.env);
  return cached;
}

/**
 * Pre-orders can be taken only while the switch is on and the promised
 * delivery date has not passed. Selling a "pre-order" after the promised date
 * would be a promise already broken, so the date closes sales automatically.
 */
export function preordersAvailable(config: AppConfig, now: Date): boolean {
  const today = now.toISOString().slice(0, 10);
  return config.preordersOpen && today <= config.shipByDate;
}

export type StripeMode = 'test' | 'live';

export function getStripeSecretKey(env: Env = process.env): string {
  const key = read(env, 'STRIPE_SECRET_KEY');
  if (key === undefined || !/^(sk|rk)_(test|live)_\w+$/.test(key)) {
    throw new ConfigError([
      'STRIPE_SECRET_KEY must be a Stripe secret or restricted key (sk_… or rk_…)',
    ]);
  }
  return key;
}

export function getStripeWebhookSecret(env: Env = process.env): string {
  const secret = read(env, 'STRIPE_WEBHOOK_SECRET');
  if (secret === undefined || !/^whsec_\w+$/.test(secret)) {
    throw new ConfigError([
      'STRIPE_WEBHOOK_SECRET must be a Stripe webhook signing secret (whsec_…)',
    ]);
  }
  return secret;
}

export function stripeModeOf(secretKey: string): StripeMode {
  return secretKey.includes('_live_') ? 'live' : 'test';
}
