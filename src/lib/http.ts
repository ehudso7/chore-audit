/**
 * Request helpers. They take a Headers object so they are trivially testable.
 */

/**
 * True when the request was sent by a page on the same host it is addressed
 * to. Browsers attach Origin to form POSTs; Referer is the fallback. A request
 * with neither is refused: the only legitimate caller is our own buy form.
 *
 * The comparison is against the Host the request arrived on, not APP_URL, so
 * preview deployments on their own hostnames keep working.
 */
export function isSameOrigin(headers: Headers): boolean {
  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  if (host === null || host === '') return false;

  const source = headers.get('origin') ?? headers.get('referer');
  if (source === null) return false;

  try {
    return new URL(source).host === host;
  } catch {
    // Covers the literal "null" origin sent from sandboxed or opaque contexts.
    return false;
  }
}

/**
 * Best available client address for rate limiting. The first x-forwarded-for
 * entry is set by the hosting proxy; if the app is ever run without a trusted
 * proxy in front, this value is client-controlled and must not be relied on.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first !== undefined && first !== '') return first;
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
