/**
 * Baseline environment for every test file. Individual tests override values
 * with vi.stubEnv(); vitest restores them afterwards (unstubEnvs: true).
 *
 * The Stripe values are syntactically valid placeholders. No test talks to
 * Stripe: signature checks are local and API calls are mocked.
 */
export const TEST_WEBHOOK_SECRET = 'whsec_test_0123456789abcdef';

Object.assign(process.env, {
  APP_URL: 'https://chore-audit.test',
  PRICE_CENTS: '1900',
  PRICE_CURRENCY: 'usd',
  SHIP_BY_DATE: '2099-01-31',
  PREORDERS_OPEN: 'true',
  SUPPORT_EMAIL: 'help@chore-audit.test',
  LEGAL_ENTITY_NAME: 'Test Seller LLC',
  STRIPE_AUTOMATIC_TAX: 'false',
  STRIPE_SECRET_KEY: 'sk_test_0123456789abcdef',
  STRIPE_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
});
