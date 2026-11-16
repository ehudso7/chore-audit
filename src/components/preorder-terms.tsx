interface PreorderTermsProps {
  readonly productName: string;
  /** What arrives by email on delivery, e.g. "access link". */
  readonly deliverable: string;
  readonly shipBy: string;
  readonly supportEmail: string;
}

/**
 * The promises every pre-order makes. Shared by all products on purpose: these
 * five statements match the terms and the refund policy, so they must not be
 * reworded per product.
 */
export function PreorderTerms({
  productName,
  deliverable,
  shipBy,
  supportEmail,
}: PreorderTermsProps) {
  return (
    <section aria-labelledby="terms" className="tinted">
      <div className="wrap">
        <h2 id="terms">The pre-order, in plain terms</h2>
        <ul className="plain-list">
          <li>
            {productName} is not available yet. You are paying now for something
            delivered later.
          </li>
          <li>
            Your {deliverable} arrives by email on or before <strong>{shipBy}</strong>.
          </li>
          <li>If we miss that date, you get a full refund without having to ask.</li>
          <li>
            We are taking pre-orders to find out whether enough people want this. If
            too few do, we will not build it and every pre-order is refunded in full.
          </li>
          <li>
            Changed your mind before delivery? Email{' '}
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a> for a full refund.
          </li>
        </ul>
      </div>
    </section>
  );
}
