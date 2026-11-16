import type Stripe from 'stripe';

export interface EventRecord {
  readonly level: 'info' | 'warn';
  readonly event: string;
  readonly fields: Readonly<Record<string, string | number | boolean | null>>;
}

/**
 * Turns a verified Stripe event into the log record we keep for it.
 *
 * In this milestone Stripe is the system of record and the webhook has no side
 * effects, so replayed or out-of-order deliveries are harmless. The moment a
 * handler gains a side effect (granting access, sending email), it must first
 * record `stripeEventId` in a unique-keyed table and skip duplicates.
 *
 * No personal data is returned: object IDs are enough to look a payment up.
 */
export function describeEvent(event: Stripe.Event): EventRecord {
  const base = { stripeEventId: event.id, livemode: event.livemode };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const paid = session.payment_status === 'paid';
      return {
        level: 'info',
        // Delayed payment methods complete the session before funds arrive.
        event: paid ? 'preorder.paid' : 'preorder.awaiting_payment',
        fields: {
          ...base,
          sessionId: session.id,
          amountTotal: session.amount_total,
          currency: session.currency,
        },
      };
    }
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;
      return {
        level: 'info',
        event: 'preorder.paid',
        fields: {
          ...base,
          sessionId: session.id,
          amountTotal: session.amount_total,
          currency: session.currency,
        },
      };
    }
    case 'checkout.session.async_payment_failed': {
      return {
        level: 'warn',
        event: 'preorder.payment_failed',
        fields: { ...base, sessionId: event.data.object.id },
      };
    }
    case 'charge.refunded': {
      const charge = event.data.object;
      return {
        level: 'info',
        event: 'preorder.refunded',
        fields: {
          ...base,
          chargeId: charge.id,
          amountRefunded: charge.amount_refunded,
          currency: charge.currency,
        },
      };
    }
    case 'charge.dispute.created': {
      return {
        level: 'warn',
        event: 'preorder.disputed',
        fields: { ...base, disputeId: event.data.object.id },
      };
    }
    default:
      return {
        level: 'info',
        event: 'stripe.event_ignored',
        fields: { ...base, type: event.type },
      };
  }
}
