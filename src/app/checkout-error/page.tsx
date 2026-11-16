import type { Metadata } from 'next';
import Link from 'next/link';
import { getConfig } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Checkout did not start',
  robots: { index: false, follow: false },
};

export default function CheckoutErrorPage() {
  const { supportEmail } = getConfig();
  return (
    <section className="narrow">
      <div className="wrap">
        <h1>We could not start checkout.</h1>
        <p>You have not been charged. Wait a minute, then try again.</p>
        <p>
          <Link className="button" href="/#buy">
            Try again
          </Link>
        </p>
        <p>
          Still stuck? Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>
      </div>
    </section>
  );
}
