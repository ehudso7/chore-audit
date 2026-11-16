import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Content Security Policy.
 *
 * script-src allows 'unsafe-inline' because Next.js emits inline bootstrap
 * scripts; a nonce-based policy would force every page to render dynamically,
 * which is the wrong trade for a static landing page that runs no third-party
 * scripts and renders no user-supplied content. Revisit when the audit (which
 * will render user input) is added.
 *
 * form-action includes Stripe because the buy form posts to our own route and
 * is then redirected to Stripe Checkout; browsers apply form-action to the
 * redirect target as well.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Dev only: React Refresh needs eval, and the analytics debug script is remote.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
