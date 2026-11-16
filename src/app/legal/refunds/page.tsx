import type { Metadata } from 'next';
import { getConfig } from '@/lib/env';
import { formatCalendarDate } from '@/lib/format';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Refund policy' };

/*
 * TEMPLATE. The 14-day window after delivery is a default chosen for the
 * template, not a legal requirement that has been checked for your market.
 * Confirm it, and have this page reviewed, before taking payments.
 */
export default function RefundsPage() {
  const config = getConfig();
  const shipBy = formatCalendarDate(config.shipByDate);
  const contact = <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>;

  return (
    <article className="legal">
      <div className="wrap">
        <h1>Refund policy</h1>

        <h2>Before delivery</h2>
        <p>
          You can cancel your pre-order for a full refund at any time before your access
          link is delivered. Email {contact} from the address you paid with.
        </p>

        <h2>If we are late or do not build it</h2>
        <p>
          If {site.name} is not delivered by {shipBy}, or we decide not to build it, we
          refund every pre-order in full. You do not need to ask.
        </p>

        <h2>After delivery</h2>
        <p>
          If you are not happy with it, email {contact} within 14 days of receiving your
          access link and we will refund you in full.
        </p>

        <h2>How refunds are paid</h2>
        <p>
          Refunds go back to the card or payment method you used. Banks usually take 5
          to 10 business days to show them.
        </p>
      </div>
    </article>
  );
}
