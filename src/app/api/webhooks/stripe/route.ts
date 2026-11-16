import type Stripe from 'stripe';
import { getStripeWebhookSecret } from '@/lib/env';
import { errorMessage, log } from '@/lib/logger';
import { getStripe } from '@/lib/stripe';
import { describeEvent } from '@/lib/webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook endpoint.
 *
 * - The raw body is verified against the signing secret before anything is
 *   parsed. Unsigned or tampered requests get 400.
 * - A configuration fault returns 500 so Stripe retries and the failure shows
 *   up in the Stripe Dashboard instead of being silently dropped.
 */
export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get('stripe-signature');
  if (signature === null) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let stripe: Stripe;
  let secret: string;
  try {
    stripe = getStripe();
    secret = getStripeWebhookSecret();
  } catch (error) {
    log('error', 'webhook.misconfigured', { error: errorMessage(error) });
    return new Response('Webhook not configured', { status: 500 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    log('warn', 'webhook.invalid_signature', { error: errorMessage(error) });
    return new Response('Invalid signature', { status: 400 });
  }

  const record = describeEvent(event);
  log(record.level, record.event, record.fields);

  return Response.json({ received: true });
}
