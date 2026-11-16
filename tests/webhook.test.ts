import Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { describeEvent } from '@/lib/webhook';
import { TEST_WEBHOOK_SECRET } from './setup';

const stripe = new Stripe('sk_test_0123456789abcdef');

function eventPayload(type: string, object: Record<string, unknown>): string {
  return JSON.stringify({
    id: 'evt_test_1',
    object: 'event',
    api_version: '2026-10-28.endive',
    created: 1_800_000_000,
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type,
    data: { object },
  });
}

function signedRequest(payload: string, secret = TEST_WEBHOOK_SECRET): Request {
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request('https://chore-audit.test/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': signature },
    body: payload,
  });
}

function loggedEvents(spy: { mock: { calls: unknown[][] } }): string[] {
  return spy.mock.calls.map((call) => (JSON.parse(String(call[0])) as { event: string }).event);
}

const paidSession = {
  id: 'cs_test_abc',
  object: 'checkout.session',
  payment_status: 'paid',
  amount_total: 1900,
  currency: 'usd',
  customer_details: { email: 'buyer@example.com', name: 'A Buyer' },
};

describe('POST /api/webhooks/stripe', () => {
  it('accepts a correctly signed event and logs it without personal data', async () => {
    const info = vi.spyOn(console, 'log').mockImplementation(() => {});

    const response = await POST(
      signedRequest(eventPayload('checkout.session.completed', paidSession)),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(loggedEvents(info)).toEqual(['preorder.paid']);
    expect(String(info.mock.calls[0]?.[0])).not.toContain('buyer@example.com');
    expect(String(info.mock.calls[0]?.[0])).not.toContain('A Buyer');
  });

  it('rejects a request with no signature', async () => {
    const response = await POST(
      new Request('https://chore-audit.test/api/webhooks/stripe', {
        method: 'POST',
        body: eventPayload('checkout.session.completed', paidSession),
      }),
    );
    expect(response.status).toBe(400);
  });

  it('rejects a payload signed with the wrong secret', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const response = await POST(
      signedRequest(
        eventPayload('checkout.session.completed', paidSession),
        'whsec_someone_elses_secret',
      ),
    );
    expect(response.status).toBe(400);
    expect(loggedEvents(warn)).toEqual(['webhook.invalid_signature']);
  });

  it('rejects a payload altered after signing', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const original = eventPayload('checkout.session.completed', paidSession);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: original,
      secret: TEST_WEBHOOK_SECRET,
    });
    const response = await POST(
      new Request('https://chore-audit.test/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': signature },
        body: original.replace('1900', '1'),
      }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 500 when the signing secret is not configured, so Stripe retries', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
    const response = await POST(
      signedRequest(eventPayload('checkout.session.completed', paidSession)),
    );
    expect(response.status).toBe(500);
  });
});

describe('describeEvent', () => {
  function parse(type: string, object: Record<string, unknown>): Stripe.Event {
    return JSON.parse(eventPayload(type, object)) as Stripe.Event;
  }

  it('distinguishes paid from awaiting payment on completion', () => {
    expect(describeEvent(parse('checkout.session.completed', paidSession)).event).toBe(
      'preorder.paid',
    );
    expect(
      describeEvent(
        parse('checkout.session.completed', { ...paidSession, payment_status: 'unpaid' }),
      ).event,
    ).toBe('preorder.awaiting_payment');
  });

  it('records delayed payment outcomes', () => {
    expect(
      describeEvent(parse('checkout.session.async_payment_succeeded', paidSession)).event,
    ).toBe('preorder.paid');
    expect(
      describeEvent(parse('checkout.session.async_payment_failed', paidSession)),
    ).toMatchObject({ level: 'warn', event: 'preorder.payment_failed' });
  });

  it('records refunds and disputes', () => {
    expect(
      describeEvent(
        parse('charge.refunded', { id: 'ch_1', amount_refunded: 1900, currency: 'usd' }),
      ),
    ).toMatchObject({
      event: 'preorder.refunded',
      fields: { chargeId: 'ch_1', amountRefunded: 1900 },
    });
    expect(describeEvent(parse('charge.dispute.created', { id: 'dp_1' }))).toMatchObject({
      level: 'warn',
      event: 'preorder.disputed',
    });
  });

  it('ignores event types it does not handle', () => {
    expect(describeEvent(parse('customer.created', { id: 'cus_1' }))).toMatchObject({
      event: 'stripe.event_ignored',
      fields: { type: 'customer.created' },
    });
  });
});
