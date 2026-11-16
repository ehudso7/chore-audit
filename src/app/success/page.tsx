import type { Metadata } from 'next';
import Link from 'next/link';
import { getConfig } from '@/lib/env';
import { formatCalendarDate } from '@/lib/format';
import { errorMessage, log } from '@/lib/logger';
import { getActiveProduct } from '@/lib/product';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pre-order received',
  robots: { index: false, follow: false },
};

type Outcome = 'paid' | 'pending' | 'unknown';

const SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

/**
 * Confirms the payment with Stripe rather than trusting the URL. Nothing about
 * the buyer is rendered, so a leaked or shared link reveals no personal data.
 */
async function lookUp(sessionId: string | undefined): Promise<Outcome> {
  if (sessionId === undefined || !SESSION_ID_PATTERN.test(sessionId)) return 'unknown';
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') return 'paid';
    if (session.status === 'complete') return 'pending';
    return 'unknown';
  } catch (error) {
    log('warn', 'success.lookup_failed', { error: errorMessage(error) });
    return 'unknown';
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = (await searchParams).session_id;
  const outcome = await lookUp(typeof raw === 'string' ? raw : undefined);
  const { shipByDate, supportEmail } = getConfig();
  const site = getActiveProduct();
  const shipBy = formatCalendarDate(shipByDate);
  const contact = <a href={`mailto:${supportEmail}`}>{supportEmail}</a>;

  return (
    <section className="narrow">
      <div className="wrap">
        {outcome === 'paid' && (
          <>
            <h1>You are in. Thank you.</h1>
            <p>
              Your pre-order for {site.name} is confirmed, and Stripe has emailed your
              receipt.
            </p>
            <p>
              Your {site.deliverable} will arrive by email on or before{' '}
              <strong>{shipBy}</strong>. If we miss that date, you will be refunded in
              full without having to ask.
            </p>
            <p>Questions, or want a refund before then? Email {contact}.</p>
          </>
        )}
        {outcome === 'pending' && (
          <>
            <h1>Your payment is processing.</h1>
            <p>
              Some payment methods take a little while to confirm. Stripe will email
              your receipt as soon as it goes through. You do not need to pay again.
            </p>
            <p>If nothing arrives within a day, email {contact}.</p>
          </>
        )}
        {outcome === 'unknown' && (
          <>
            <h1>We could not confirm that payment.</h1>
            <p>
              If you completed checkout, you will have a receipt from Stripe in your
              inbox and your pre-order is safe. If you have no receipt, you have not
              been charged.
            </p>
            <p>Not sure which? Email {contact} and we will check.</p>
          </>
        )}
        <p>
          <Link href="/">Back to the home page</Link>
        </p>
      </div>
    </section>
  );
}
