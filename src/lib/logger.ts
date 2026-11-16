/**
 * Structured JSON logs, one object per line, so the hosting platform's log
 * search and drains can filter on `event`.
 *
 * Never pass personal data (emails, names, addresses) or secrets here. Stripe
 * object IDs are enough to find the full record in the Stripe Dashboard.
 */

type Level = 'info' | 'warn' | 'error';
type Fields = Readonly<Record<string, string | number | boolean | null | undefined>>;

export function log(level: Level, event: string, fields: Fields = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error';
}
