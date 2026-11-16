import { describe, expect, it } from 'vitest';
import {
  ConfigError,
  getStripeSecretKey,
  getStripeWebhookSecret,
  parseConfig,
  preordersAvailable,
  stripeModeOf,
} from '@/lib/env';

const valid = {
  APP_URL: 'https://example.com',
  SHIP_BY_DATE: '2027-01-31',
  SUPPORT_EMAIL: 'help@example.com',
  LEGAL_ENTITY_NAME: 'Example LLC',
};

function problemsOf(env: Record<string, string | undefined>): readonly string[] {
  try {
    parseConfig(env);
  } catch (error) {
    if (error instanceof ConfigError) return error.problems;
    throw error;
  }
  return [];
}

describe('parseConfig', () => {
  it('applies defaults for optional settings', () => {
    expect(parseConfig(valid)).toEqual({
      productKey: 'chore-audit',
      appUrl: 'https://example.com',
      priceCents: 1900,
      currency: 'usd',
      shipByDate: '2027-01-31',
      preordersOpen: true,
      supportEmail: 'help@example.com',
      legalEntityName: 'Example LLC',
      automaticTax: false,
    });
  });

  it('reads explicit values and normalises the origin and currency', () => {
    const config = parseConfig({
      ...valid,
      APP_URL: 'https://Example.com/',
      PRICE_CENTS: '2450',
      PRICE_CURRENCY: 'GBP',
      PREORDERS_OPEN: 'false',
      STRIPE_AUTOMATIC_TAX: 'true',
    });
    expect(config.appUrl).toBe('https://example.com');
    expect(config.priceCents).toBe(2450);
    expect(config.currency).toBe('gbp');
    expect(config.preordersOpen).toBe(false);
    expect(config.automaticTax).toBe(true);
  });

  it('allows http only for localhost', () => {
    expect(parseConfig({ ...valid, APP_URL: 'http://localhost:3000' }).appUrl).toBe(
      'http://localhost:3000',
    );
    expect(problemsOf({ ...valid, APP_URL: 'http://example.com' })).toHaveLength(1);
  });

  it('rejects an APP_URL that carries a path', () => {
    expect(problemsOf({ ...valid, APP_URL: 'https://example.com/shop' })).toHaveLength(1);
  });

  it.each([
    ['PRICE_CENTS', '19.00'],
    ['PRICE_CENTS', '0'],
    ['PRICE_CENTS', '99'],
    ['PRICE_CENTS', '100001'],
    ['PRICE_CENTS', '-5'],
    ['PRICE_CURRENCY', 'jpy'],
    ['SHIP_BY_DATE', '31/01/2027'],
    ['SHIP_BY_DATE', '2027-02-30'],
    ['SUPPORT_EMAIL', 'not-an-email'],
    ['PREORDERS_OPEN', 'yes'],
    ['STRIPE_AUTOMATIC_TAX', '1'],
    ['LEGAL_ENTITY_NAME', 'x'.repeat(121)],
  ])('rejects %s=%s', (key, value) => {
    expect(problemsOf({ ...valid, [key]: value })).toHaveLength(1);
  });

  it('reports every problem at once', () => {
    const problems = problemsOf({});
    expect(problems).toEqual(
      expect.arrayContaining([
        expect.stringContaining('APP_URL'),
        expect.stringContaining('SHIP_BY_DATE'),
        expect.stringContaining('SUPPORT_EMAIL'),
        expect.stringContaining('LEGAL_ENTITY_NAME'),
      ]),
    );
    expect(problems).toHaveLength(4);
  });

  it('treats blank values as missing', () => {
    expect(problemsOf({ ...valid, SUPPORT_EMAIL: '   ' })).toEqual([
      'SUPPORT_EMAIL is required',
    ]);
  });
});

describe('product selection', () => {
  it('sells the Chore Audit when PRODUCT is unset, so existing deployments are unchanged', () => {
    const config = parseConfig(valid);
    expect(config.productKey).toBe('chore-audit');
    expect(config.priceCents).toBe(1900);
  });

  it('selects a product by key and applies that product\'s default price', () => {
    const config = parseConfig({ ...valid, PRODUCT: 'anime-starter-pack' });
    expect(config.productKey).toBe('anime-starter-pack');
    expect(config.priceCents).toBe(900);
  });

  it('lets PRICE_CENTS override the product default', () => {
    const config = parseConfig({
      ...valid,
      PRODUCT: 'anime-starter-pack',
      PRICE_CENTS: '1200',
    });
    expect(config.priceCents).toBe(1200);
  });

  it('rejects an unknown product instead of silently selling the default', () => {
    expect(problemsOf({ ...valid, PRODUCT: 'anime' })).toEqual([
      'PRODUCT must be one of: chore-audit, anime-starter-pack',
    ]);
  });
});

describe('preordersAvailable', () => {
  const config = parseConfig(valid);

  it('is open up to and including the ship-by date', () => {
    expect(preordersAvailable(config, new Date('2027-01-30T12:00:00Z'))).toBe(true);
    expect(preordersAvailable(config, new Date('2027-01-31T23:59:59Z'))).toBe(true);
  });

  it('closes the day after the ship-by date', () => {
    expect(preordersAvailable(config, new Date('2027-02-01T00:00:00Z'))).toBe(false);
  });

  it('is closed whenever the switch is off', () => {
    const closed = parseConfig({ ...valid, PREORDERS_OPEN: 'false' });
    expect(preordersAvailable(closed, new Date('2026-12-01T00:00:00Z'))).toBe(false);
  });
});

describe('Stripe secrets', () => {
  it('accepts secret and restricted keys', () => {
    expect(getStripeSecretKey({ STRIPE_SECRET_KEY: 'sk_test_abc123' })).toBe('sk_test_abc123');
    expect(getStripeSecretKey({ STRIPE_SECRET_KEY: 'rk_live_abc123' })).toBe('rk_live_abc123');
  });

  it('rejects publishable keys and missing values', () => {
    expect(() => getStripeSecretKey({ STRIPE_SECRET_KEY: 'pk_test_abc123' })).toThrow(ConfigError);
    expect(() => getStripeSecretKey({})).toThrow(ConfigError);
  });

  it('validates the webhook secret', () => {
    expect(getStripeWebhookSecret({ STRIPE_WEBHOOK_SECRET: 'whsec_abc123' })).toBe('whsec_abc123');
    expect(() => getStripeWebhookSecret({ STRIPE_WEBHOOK_SECRET: 'sk_test_abc' })).toThrow(
      ConfigError,
    );
  });

  it('derives the mode from the key', () => {
    expect(stripeModeOf('sk_test_abc')).toBe('test');
    expect(stripeModeOf('rk_live_abc')).toBe('live');
  });
});
