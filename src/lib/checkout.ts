import type Stripe from 'stripe';
import type { AppConfig } from './env';
import { formatCalendarDate } from './format';
import { getProduct } from '@/products/registry';

/**
 * Builds the Checkout Session request. Pure, so the exact request sent to
 * Stripe is covered by unit tests.
 *
 * The amount comes from configuration via inline price_data rather than a
 * Stripe Price ID. That keeps one source of truth for the price shown on the
 * page and the price charged; they cannot drift apart.
 */
export function buildCheckoutParams(
  config: AppConfig,
): Stripe.Checkout.SessionCreateParams {
  const product = getProduct(config.productKey);
  const shipBy = formatCalendarDate(config.shipByDate);
  const promise = `Delivered by ${shipBy} or refunded in full.`;
  const metadata = {
    product: product.stripeProductKey,
    ship_by: config.shipByDate,
  };

  return {
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: config.currency,
          unit_amount: config.priceCents,
          product_data: {
            name: `${product.name} (pre-order)`,
            description: `${product.checkoutSummary} ${promise}`,
          },
        },
      },
    ],
    success_url: `${config.appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.appUrl}/#buy`,
    submit_type: 'pay',
    customer_creation: 'always',
    automatic_tax: { enabled: config.automaticTax },
    custom_text: {
      submit: {
        message: `This is a pre-order. ${product.name} is not available yet. ${promise}`,
      },
    },
    metadata,
    payment_intent_data: {
      description: `${product.name} pre-order`,
      metadata,
    },
  };
}
