import {
  getConfig,
  getStripeSecretKey,
  getStripeWebhookSecret,
  preordersAvailable,
  stripeModeOf,
} from '@/lib/env';
import { errorMessage, log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Liveness and configuration check for uptime monitors.
 *
 * Reports whether the deployment is correctly configured and whether it is
 * taking pre-orders, without calling Stripe and without exposing any value
 * that is not already public on the landing page.
 */
export function GET(): Response {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const config = getConfig();
    const stripeMode = stripeModeOf(getStripeSecretKey());
    getStripeWebhookSecret();
    return Response.json(
      {
        status: 'ok',
        preordersAvailable: preordersAvailable(config, new Date()),
        stripeMode,
      },
      { headers },
    );
  } catch (error) {
    log('error', 'health.misconfigured', { error: errorMessage(error) });
    return Response.json({ status: 'misconfigured' }, { status: 503, headers });
  }
}
