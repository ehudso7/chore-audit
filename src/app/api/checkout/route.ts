import { randomUUID } from 'node:crypto';
import { buildCheckoutParams } from '@/lib/checkout';
import { getConfig, preordersAvailable } from '@/lib/env';
import { clientIp, isSameOrigin } from '@/lib/http';
import { errorMessage, log } from '@/lib/logger';
import { createRateLimiter } from '@/lib/rate-limit';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ten attempts a minute per address is far above what a person needs.
const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

function seeOther(location: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: location, 'Cache-Control': 'no-store' },
  });
}

/**
 * Starts a Stripe Checkout Session and sends the browser to it.
 *
 * Called by a plain HTML form, so every outcome a person can reach is a
 * redirect to a page rather than a JSON body. Works with JavaScript disabled.
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = randomUUID();

  if (!isSameOrigin(request.headers)) {
    log('warn', 'checkout.rejected_cross_origin', { requestId });
    return new Response('Forbidden', { status: 403 });
  }

  let config;
  try {
    config = getConfig();
  } catch (error) {
    log('error', 'checkout.misconfigured', { requestId, error: errorMessage(error) });
    return new Response('Service unavailable', { status: 503 });
  }

  if (!preordersAvailable(config, new Date())) {
    log('info', 'checkout.rejected_closed', { requestId });
    return seeOther(`${config.appUrl}/closed`);
  }

  const limit = limiter.check(clientIp(request.headers));
  if (!limit.allowed) {
    log('warn', 'checkout.rate_limited', {
      requestId,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return seeOther(`${config.appUrl}/checkout-error`);
  }

  try {
    const session = await getStripe().checkout.sessions.create(
      buildCheckoutParams(config),
    );
    if (session.url === null) {
      throw new Error('Stripe returned a Checkout Session without a URL');
    }
    log('info', 'checkout.session_created', { requestId, sessionId: session.id });
    return seeOther(session.url);
  } catch (error) {
    log('error', 'checkout.session_failed', { requestId, error: errorMessage(error) });
    return seeOther(`${config.appUrl}/checkout-error`);
  }
}
