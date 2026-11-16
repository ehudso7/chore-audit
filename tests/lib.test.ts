import { describe, expect, it } from 'vitest';
import { buildCheckoutParams } from '@/lib/checkout';
import { parseConfig } from '@/lib/env';
import { formatCalendarDate, formatPrice } from '@/lib/format';
import { clientIp, isSameOrigin } from '@/lib/http';
import { createRateLimiter } from '@/lib/rate-limit';

describe('formatPrice', () => {
  it('drops the decimals for whole amounts', () => {
    expect(formatPrice(1900, 'usd')).toBe('$19');
  });

  it('keeps two decimals otherwise', () => {
    expect(formatPrice(1950, 'usd')).toBe('$19.50');
  });

  it('uses the currency symbol', () => {
    expect(formatPrice(1900, 'gbp')).toBe('£19');
  });
});

describe('formatCalendarDate', () => {
  it('formats without shifting across time zones', () => {
    expect(formatCalendarDate('2027-01-31')).toBe('January 31, 2027');
    expect(formatCalendarDate('2027-03-01')).toBe('March 1, 2027');
  });
});

describe('isSameOrigin', () => {
  it('accepts a matching Origin', () => {
    const headers = new Headers({ host: 'example.com', origin: 'https://example.com' });
    expect(isSameOrigin(headers)).toBe(true);
  });

  it('prefers the forwarded host set by the proxy', () => {
    const headers = new Headers({
      host: 'internal:3000',
      'x-forwarded-host': 'example.com',
      origin: 'https://example.com',
    });
    expect(isSameOrigin(headers)).toBe(true);
  });

  it('falls back to Referer when Origin is absent', () => {
    const headers = new Headers({ host: 'example.com', referer: 'https://example.com/' });
    expect(isSameOrigin(headers)).toBe(true);
  });

  it.each([
    ['a different site', { host: 'example.com', origin: 'https://evil.test' }],
    ['a lookalike subdomain', { host: 'example.com', origin: 'https://example.com.evil.test' }],
    ['an opaque origin', { host: 'example.com', origin: 'null' }],
    ['no origin or referer', { host: 'example.com' }],
    ['no host', { origin: 'https://example.com' }],
  ])('rejects %s', (_label, init) => {
    expect(isSameOrigin(new Headers(init as Record<string, string>))).toBe(false);
  });
});

describe('clientIp', () => {
  it('takes the first forwarded address', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' });
    expect(clientIp(headers)).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip, then to a constant', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});

describe('createRateLimiter', () => {
  it('allows up to the limit, then blocks until the window resets', () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => time });

    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(true);

    time = 15_000;
    expect(limiter.check('a')).toEqual({ allowed: false, retryAfterSeconds: 45 });

    time = 60_000;
    expect(limiter.check('a').allowed).toBe(true);
  });

  it('counts keys independently', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('b').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);
  });

  it('never tracks more keys than the cap', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2, now: () => 0 });
    limiter.check('a');
    limiter.check('b');
    limiter.check('c'); // evicts the oldest live window, 'a'
    expect(limiter.check('a').allowed).toBe(true);
  });
});

describe('buildCheckoutParams', () => {
  const config = parseConfig({
    APP_URL: 'https://example.com',
    PRICE_CENTS: '1900',
    PRICE_CURRENCY: 'usd',
    SHIP_BY_DATE: '2027-01-31',
    SUPPORT_EMAIL: 'help@example.com',
    LEGAL_ENTITY_NAME: 'Example LLC',
  });
  const params = buildCheckoutParams(config);

  it('charges exactly the configured price, once', () => {
    expect(params.mode).toBe('payment');
    expect(params.line_items).toHaveLength(1);
    const item = params.line_items?.[0];
    expect(item?.quantity).toBe(1);
    expect(item?.price_data?.unit_amount).toBe(1900);
    expect(item?.price_data?.currency).toBe('usd');
  });

  it('returns to the canonical origin', () => {
    expect(params.success_url).toBe(
      'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
    );
    expect(params.cancel_url).toBe('https://example.com/#buy');
  });

  it('states the pre-order promise where the buyer pays', () => {
    const submit = params.custom_text?.submit;
    const message = submit && typeof submit === 'object' ? (submit.message ?? '') : '';
    expect(message).toContain('This is a pre-order');
    expect(message).toContain('January 31, 2027');
    // Stripe caps this field at 1200 characters.
    expect(message.length).toBeLessThanOrEqual(1200);
  });

  it('tags the session and the payment so pre-orders can be filtered', () => {
    const expected = { product: 'chore-audit-preorder', ship_by: '2027-01-31' };
    expect(params.metadata).toEqual(expected);
    expect(params.payment_intent_data?.metadata).toEqual(expected);
  });

  it('enables automatic tax only when configured', () => {
    expect(params.automatic_tax).toEqual({ enabled: false });
  });
});
