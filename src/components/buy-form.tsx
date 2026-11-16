interface BuyFormProps {
  readonly available: boolean;
  readonly price: string;
  readonly shipBy: string;
  /** What one payment covers, e.g. "household". */
  readonly purchaseUnit: string;
  readonly id?: string;
}

/**
 * A plain HTML form. It posts to our own route, which creates the Checkout
 * Session and redirects to Stripe. No client-side JavaScript is involved.
 */
export function BuyForm({
  available,
  price,
  shipBy,
  purchaseUnit,
  id,
}: BuyFormProps) {
  if (!available) {
    return (
      <div className="buy" id={id}>
        <p className="notice" role="status">
          Pre-orders are closed right now.
        </p>
      </div>
    );
  }

  return (
    <form className="buy" id={id} action="/api/checkout" method="post">
      <button type="submit" className="button">
        Pre-order for {price}
      </button>
      <p className="fine-print">
        One-time payment per {purchaseUnit}. No subscription. Full refund if it is
        not delivered by {shipBy}, or any time before delivery if you change your
        mind. Payment is handled by Stripe.
      </p>
    </form>
  );
}
