import type { Metadata } from 'next';
import Link from 'next/link';
import { getConfig } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Pre-orders are closed',
  robots: { index: false, follow: false },
};

export default function ClosedPage() {
  const { supportEmail } = getConfig();
  return (
    <section className="narrow">
      <div className="wrap">
        <h1>Pre-orders are closed right now.</h1>
        <p>You have not been charged.</p>
        <p>
          If you would like to hear when it is available, email{' '}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>
        <p>
          <Link href="/">Back to the home page</Link>
        </p>
      </div>
    </section>
  );
}
