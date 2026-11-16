import { beforeEach, describe, expect, it, vi } from 'vitest';

const createSession = vi.fn();

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({ checkout: { sessions: { create: createSession } } }),
}));

/**
 * The route keeps module-level state (cached config, rate limiter), so each
 * test loads a fresh copy after setting its environment.
 */
async function loadRoute() {
  vi.resetModules();
  return import('@/app/api/checkout/route');
}

function formPost(headers: Record<string, string> = {}): Request {
  return new Request('https://chore-audit.test/api/checkout', {
    method: 'POST',
    headers: {
      host: 'chore-audit.test',
      origin: 'https://chore-audit.test',
      'x-forwarded-for': '203.0.113.7',
      ...headers,
    },
  });
}

beforeEach(() => {
  createSession.mockReset();
  createSession.mockResolvedValue({
    id: 'cs_test_abc',
    url: 'https://checkout.stripe.com/c/pay/cs_test_abc',
  });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/checkout', () => {
  it('creates a session and redirects the browser to Stripe', async () => {
    const { POST } = await loadRoute();
    const response = await POST(formPost());

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://checkout.stripe.com/c/pay/cs_test_abc',
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(createSession.mock.calls[0]?.[0]).toMatchObject({
      mode: 'payment',
      line_items: [{ quantity: 1, price_data: { unit_amount: 1900, currency: 'usd' } }],
    });
  });

  it('refuses a cross-site form post without calling Stripe', async () => {
    const { POST } = await loadRoute();
    const response = await POST(formPost({ origin: 'https://evil.test' }));

    expect(response.status).toBe(403);
    expect(createSession).not.toHaveBeenCalled();
  });

  it('sends the buyer to the closed page when the kill switch is off', async () => {
    vi.stubEnv('PREORDERS_OPEN', 'false');
    const { POST } = await loadRoute();
    const response = await POST(formPost());

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://chore-audit.test/closed');
    expect(createSession).not.toHaveBeenCalled();
  });

  it('closes automatically once the ship-by date has passed', async () => {
    vi.stubEnv('SHIP_BY_DATE', '2020-01-01');
    const { POST } = await loadRoute();
    const response = await POST(formPost());

    expect(response.headers.get('location')).toBe('https://chore-audit.test/closed');
    expect(createSession).not.toHaveBeenCalled();
  });

  it('rate limits a single address and leaves others unaffected', async () => {
    const { POST } = await loadRoute();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await POST(formPost())).headers.get('location')).toContain('checkout.stripe.com');
    }

    const blocked = await POST(formPost());
    expect(blocked.status).toBe(303);
    expect(blocked.headers.get('location')).toBe('https://chore-audit.test/checkout-error');
    expect(createSession).toHaveBeenCalledTimes(10);

    const other = await POST(formPost({ 'x-forwarded-for': '198.51.100.4' }));
    expect(other.headers.get('location')).toContain('checkout.stripe.com');
  });

  it('shows the error page when Stripe fails, and logs the cause', async () => {
    createSession.mockRejectedValue(new Error('Stripe is unreachable'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { POST } = await loadRoute();
    const response = await POST(formPost());

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://chore-audit.test/checkout-error');
    expect(String(error.mock.calls[0]?.[0])).toContain('checkout.session_failed');
  });

  it('treats a session without a URL as a failure', async () => {
    createSession.mockResolvedValue({ id: 'cs_test_abc', url: null });
    const { POST } = await loadRoute();
    const response = await POST(formPost());

    expect(response.headers.get('location')).toBe('https://chore-audit.test/checkout-error');
  });

  it('returns 503 when the deployment is misconfigured', async () => {
    vi.stubEnv('SUPPORT_EMAIL', '');
    const { POST } = await loadRoute();
    const response = await POST(formPost());

    expect(response.status).toBe(503);
    expect(createSession).not.toHaveBeenCalled();
  });
});
