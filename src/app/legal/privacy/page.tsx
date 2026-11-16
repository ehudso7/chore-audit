import type { Metadata } from 'next';
import { getConfig } from '@/lib/env';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy' };

/*
 * TEMPLATE. Describes what this pre-order site does today. It has not been
 * reviewed by a lawyer. Check each statement against your Stripe and hosting
 * settings, and have it reviewed, before taking payments. It must be rewritten
 * when the audit itself launches and starts storing answers.
 */
export default function PrivacyPage() {
  const config = getConfig();
  const contact = <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>;

  return (
    <article className="legal">
      <div className="wrap">
        <h1>Privacy</h1>
        <p>
          This page covers the {site.name} pre-order site, run by{' '}
          {config.legalEntityName}.
        </p>

        <h2>What we collect, and why</h2>
        <ul>
          <li>
            <strong>Payment details.</strong> When you pre-order, Stripe collects your
            email address, name, billing address and payment details to take the
            payment and send your receipt. Your card number goes to Stripe and never
            reaches our servers. We can see your name, email, billing address and the
            payment record in our Stripe account.
          </li>
          <li>
            <strong>Your email address.</strong> We use it to deliver your access link,
            to tell you about anything affecting your order, and to refund you.
          </li>
          <li>
            <strong>Basic visit statistics.</strong> We count page views using our
            hosting provider&apos;s analytics. We do not use advertising trackers.
          </li>
          <li>
            <strong>Server logs.</strong> Our hosting provider keeps short-lived
            technical logs, including IP addresses, to keep the site running and to
            stop abuse.
          </li>
        </ul>

        <h2>What we do not do</h2>
        <p>
          We do not sell your information, and we do not send marketing email unless you
          ask for it.
        </p>

        <h2>Who handles your information</h2>
        <p>
          Stripe (payments) and Vercel (hosting and visit statistics) process
          information on our behalf.
        </p>

        <h2>Your choices</h2>
        <p>
          Email {contact} to see, correct or delete the information we hold about you.
          We keep payment records for as long as tax and accounting rules require.
        </p>

        <h2>When the audit launches</h2>
        <p>
          The audit will store the answers you and your partner give. We will publish
          exactly how those are stored and for how long before it launches. If you do
          not like what you read, you can have a full refund.
        </p>
      </div>
    </article>
  );
}
