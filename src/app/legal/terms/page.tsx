import type { Metadata } from 'next';
import Link from 'next/link';
import { getConfig } from '@/lib/env';
import { formatCalendarDate, formatPrice } from '@/lib/format';
import { getActiveProduct } from '@/lib/product';

export const metadata: Metadata = { title: 'Terms of sale' };

/*
 * TEMPLATE. Written in plain language as a starting point. It has not been
 * reviewed by a lawyer and does not name a governing law. Have it reviewed
 * before taking payments.
 */
export default function TermsPage() {
  const config = getConfig();
  const site = getActiveProduct();
  const shipBy = formatCalendarDate(config.shipByDate);
  const price = formatPrice(config.priceCents, config.currency);

  return (
    <article className="legal">
      <div className="wrap">
        <h1>Terms of sale</h1>

        <h2>Who you are buying from</h2>
        <p>
          {site.name} is sold by {config.legalEntityName}. You can reach us at{' '}
          <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>.
        </p>

        <h2>What you are buying</h2>
        <p>
          A pre-order of {site.name}: {site.legal.whatYouAreBuying}. The price is{' '}
          {price}, paid once. There is no subscription. Any taxes that apply are shown
          at checkout.
        </p>

        <h2>This is a pre-order</h2>
        <p>
          {site.name} is not available yet. We will email your {site.deliverable} on or
          before {shipBy}. If we do not deliver by that date, or if we decide not to build it,
          we will refund your payment in full without you having to ask.
        </p>

        <h2>Refunds</h2>
        <p>
          See the <Link href="/legal/refunds">refund policy</Link>, which forms part of
          these terms.
        </p>

        <h2>Using it</h2>
        <p>
          {site.legal.usingIt}
        </p>

        <h2>What it is not</h2>
        <p>
          {site.name} is {site.legal.whatItIsNot}
        </p>

        <h2>If something goes wrong</h2>
        <p>
          If we fail to deliver what these terms describe, our responsibility to you is
          limited to refunding what you paid. Nothing here limits any rights you have
          under consumer law that cannot be limited.
        </p>

        <h2>Changes</h2>
        <p>
          If we change these terms before delivery in a way that affects you, we will
          email you, and you may take a full refund instead.
        </p>
      </div>
    </article>
  );
}
