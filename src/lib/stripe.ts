import Stripe from 'stripe';
import { getStripeSecretKey } from './env';

let client: Stripe | undefined;

/**
 * Lazily constructed Stripe client. The API version is the one pinned by the
 * installed SDK (see package-lock.json); upgrading the SDK is the deliberate
 * act that moves the API version.
 */
export function getStripe(): Stripe {
  client ??= new Stripe(getStripeSecretKey(), {
    maxNetworkRetries: 2,
    timeout: 10_000,
    appInfo: { name: 'chore-audit', version: '0.1.0' },
  });
  return client;
}
