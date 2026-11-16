import type { Currency } from './env';

/** "$19" for whole amounts, "$19.50" otherwise. */
export function formatPrice(cents: number, currency: Currency): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

/** "2027-01-31" -> "January 31, 2027". Dates are calendar dates, read as UTC. */
export function formatCalendarDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
