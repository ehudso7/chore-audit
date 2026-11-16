# Pre-sell site: The Chore Audit and Anime Starter Pack

A landing page that takes real pre-orders through Stripe Checkout, so demand is
measured with money before a product is built. One codebase, one product per
deployment: the `PRODUCT` variable chooses which. See [Products](#products).

**What this is:** landing page, Stripe Checkout, signed webhook, legal page
templates, tests, CI.
**What this is not:** either product itself. Nothing here delivers anything.
See [Roadmap](#roadmap).

- Architecture and the reasons behind each decision: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Operating it (launch checklist, refunds, the launch gate, incidents): [docs/RUNBOOK.md](docs/RUNBOOK.md)

## Stack

| Piece | Version | Notes |
| --- | --- | --- |
| Node.js | 22 | `.nvmrc`; `engines` requires 22.12 or later |
| Next.js (App Router) | 16.4 | Static pages, three route handlers |
| React | 19.3 | Server components only, apart from the error boundary |
| TypeScript | 6.0 | Strict. Not 7.x: `typescript-eslint` 8 supports below 6.1 |
| Stripe SDK | 23.1 | API version pinned by the SDK |
| Vitest | 5.1 | Unit and route-handler tests |

Runtime dependencies are `next`, `react`, `react-dom`, `stripe` and
`@vercel/analytics`. There is no database, no CSS framework and no client-side
state.

## Products

| `PRODUCT` | Name | Default price | Stripe metadata tag |
| --- | --- | --- | --- |
| `chore-audit` (default) | The Chore Audit | `1900` | `product=chore-audit-preorder` |
| `anime-starter-pack` | Anime Starter Pack | `900` | `product=anime-starter-pack-preorder` |

Each product is a folder under `src/products/` holding its facts
(`product.ts`) and its landing page (`home.tsx`). Checkout, the webhook, the
pre-order terms, the legal templates and every safety rule are shared, so a fix
lands once. A deployment with `PRODUCT` unset sells The Chore Audit exactly as
before.

To add a product: add its key to `PRODUCT_KEYS` in `src/products/types.ts`,
then follow the compile errors. The registry and the page map are exhaustive
by type. `tests/products.test.ts` then covers the new product without edits.

Both names are working names. No trademark or domain search has been done on
either.

## Run it locally

```bash
nvm use
npm ci
cp .env.example .env.local   # then fill in the blanks
npm run dev
```

To take a test payment end to end you need a Stripe account in test mode:

1. Put a test secret key (`sk_test_…`) in `STRIPE_SECRET_KEY`.
2. Forward webhooks with the Stripe CLI and copy the signing secret it prints
   into `STRIPE_WEBHOOK_SECRET`:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Open http://localhost:3000, press the pre-order button and pay with the test
   card `4242 4242 4242 4242`, any future expiry, any CVC.
4. You should land on `/success` showing the confirmation, and the dev server
   log should show a `preorder.paid` line.

## Configuration

All settings are environment variables, validated on first use. A bad value
fails with the full list of problems. See [.env.example](.env.example) for
descriptions.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `APP_URL` | yes | | Canonical origin. Used for Stripe return URLs and metadata |
| `SHIP_BY_DATE` | yes | | Delivery promise shown to buyers. Sales close after it |
| `SUPPORT_EMAIL` | yes | | Shown on every page and in the terms |
| `LEGAL_ENTITY_NAME` | yes | | The seller named in the terms |
| `PRODUCT` | no | `chore-audit` | Which product this deployment sells |
| `PRICE_CENTS` | no | the product's default | Price shown and charged |
| `PRICE_CURRENCY` | no | `usd` | One of usd, eur, gbp, cad, aud |
| `PREORDERS_OPEN` | no | `true` | Kill switch |
| `STRIPE_AUTOMATIC_TAX` | no | `false` | Needs Stripe Tax set up first |
| `STRIPE_SECRET_KEY` | at runtime | | Secret or restricted key |
| `STRIPE_WEBHOOK_SECRET` | at runtime | | Webhook signing secret |

The first nine are read at build time, because the pages are static. Changing
one needs a redeploy. The two Stripe secrets are read per request and are never
needed to build.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint (Next.js core-web-vitals and TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run check` | Everything CI runs, in order |

## Routes

| Route | Type | Purpose |
| --- | --- | --- |
| `/` | static, revalidated hourly | Landing page |
| `POST /api/checkout` | dynamic | Creates a Checkout Session, redirects to Stripe |
| `POST /api/webhooks/stripe` | dynamic | Verifies and logs Stripe events |
| `GET /api/health` | dynamic | Configuration and availability check |
| `/success` | dynamic | Confirms the payment with Stripe |
| `/closed`, `/checkout-error` | static | Where the checkout route sends people |
| `/legal/terms`, `/legal/refunds`, `/legal/privacy` | static | Templates. Need legal review |

## Deploying

The app is a standard Next.js project and deploys to Vercel without extra
configuration. The full sequence, including the Stripe settings that must be
turned on, is the launch checklist in [docs/RUNBOOK.md](docs/RUNBOOK.md).

## Known gaps

Read these before launch. None is hidden behind a passing test.

- **No payment has been taken through this code.** The Stripe request is
  type-checked against the SDK and unit-tested, and the failure path was
  exercised against the real Stripe API with an invalid key. A successful test
  payment needs your Stripe test key. Do the local walkthrough above first.
- **The legal pages are templates.** They have not been reviewed by a lawyer
  and name no governing law. The 14-day refund window after delivery is a
  placeholder default.
- **Sales tax is off by default.** Whether you must collect it depends on where
  you and your buyers are. Decide before launch.
- **Rate limiting is per server instance.** Add a firewall rule (see the
  runbook) for a real limit.
- **Dev-only audit findings.** `npm audit` reports moderate advisories in
  `minimatch`, reached through `eslint-config-next`'s `typescript-eslint`. They
  are in lint tooling, not in anything deployed. `npm audit --omit=dev` is the
  check CI enforces.
- **Both product names are working names.** No trademark or domain search has
  been done.
- **Products sharing one Stripe account see each other's webhook events.**
  Stripe sends an account's events to every endpoint. Log records carry a
  `product` field for filtering; count pre-orders by Stripe metadata, not by
  log lines.
- **Anime Starter Pack is sold to any country Stripe Checkout accepts.** Tax on
  digital goods differs by US state and by country, and this code does not
  restrict where buyers are. Decide on tax, and on any country restriction in
  the Stripe account, before sending traffic.
- **No end-to-end browser test.** Add one (Playwright) when the audit flow
  exists and there is something stateful to protect.

## Roadmap

1. **Milestone 1, this repo:** pre-sell and measure, per product. Exit criteria
   are in the runbook under "The launch gate".
2. **Milestone 2, only for a product whose gate passes:**
   - *The Chore Audit:* a database, the two-partner flow, the gap report, the
     agreement and the calendar file.
   - *Anime Starter Pack:* a database, a hand-checked catalogue of titles, the
     taste quiz, the matching rule and the pack page.

   In both, the webhook becomes the fulfilment trigger; ARCHITECTURE.md lists
   what must change when it does.
