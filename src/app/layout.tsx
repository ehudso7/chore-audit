import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import { getConfig } from '@/lib/env';
import { site } from '@/lib/site';
import './globals.css';

export function generateMetadata(): Metadata {
  const { appUrl } = getConfig();
  return {
    metadataBase: new URL(appUrl),
    title: { default: `${site.name}: ${site.tagline}`, template: `%s | ${site.name}` },
    description: site.description,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: `${site.name}: ${site.tagline}`,
      description: site.description,
      url: '/',
    },
    twitter: { card: 'summary' },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf8f3' },
    { media: '(prefers-color-scheme: dark)', color: '#16181a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { legalEntityName, supportEmail } = getConfig();
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="wrap">
            <Link className="brand" href="/">
              {site.name}
            </Link>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <nav aria-label="Legal">
              <Link href="/legal/terms">Terms</Link>
              <Link href="/legal/refunds">Refunds</Link>
              <Link href="/legal/privacy">Privacy</Link>
              <a href={`mailto:${supportEmail}`}>Contact</a>
            </nav>
            <p>
              © {new Date().getUTCFullYear()} {legalEntityName}. {site.name} is a
              practical tool for dividing housework. It is not counselling or therapy.
            </p>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
