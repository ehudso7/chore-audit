# Architecture

## Purpose of this milestone

Answer one question cheaply, once per product: will strangers pay for it?
Everything here serves taking a real pre-order safely and counting it. Anything that only
matters once the product exists is deferred, and each deferral is written down
below with the trigger for revisiting it.

## Request flow

```
Browser                       This app                          Stripe
  |  GET /                      |                                 |
  |---------------------------->|  static HTML, no client JS      |
  |  POST /api/checkout (form)  |                                 |
  |---------------------------->|  same-origin check              |
  |                             |  availability check             |
  |                             |  rate limit                     |
  |                             |  checkout.sessions.create ----->|
  |  303 -> checkout.stripe.com |<------------- session.url ------|
  |<----------------------------|                                 |
  |  pays on Stripe-hosted page ------------------------------->  |
  |  303 -> /success?session_id |                                 |
  |---------------------------->|  checkout.sessions.retrieve --->|
  |  confirmation               |<------------- payment_status ---|
  |                             |                                 |
  |                             |  POST /api/webhooks/stripe <----|
  |                             |  verify signature, log event    |
```

## Decisions

Each entry gives the choice, the reason, and what would change it.

### 1. Stripe-hosted Checkout, not an embedded form

Card data never touches this app, which keeps PCI scope at the lowest level
Stripe offers and means no Stripe JavaScript on our pages. The cost is less
control over the payment page's appearance, which does not matter for a demand
test.

### 2. No database in this milestone

Stripe already stores every fact this milestone needs: who paid, how much,
when, and whether it was refunded. A second copy would add a migration path, a
backup duty and a way for the two to disagree, in exchange for nothing a buyer
or operator can use yet.

*Revisit when:* the audit is built. It needs a database for answers and access
links (Postgres via Prisma, in line with the rest of the portfolio).

### 3. The webhook verifies and logs, and does nothing else

The endpoint exists now because it is the correct place for fulfilment later
and because delayed payment methods only report their outcome by webhook. With
no side effects, duplicate or out-of-order deliveries are harmless.

*Must change in milestone 2:* before a handler grants access or sends email, it
has to record the Stripe event ID under a unique constraint and skip repeats,
inside the same transaction as the side effect. Stripe delivers at least once.

### 4. Price in configuration, sent as inline `price_data`

The page shows `PRICE_CENTS` and the checkout request charges `PRICE_CENTS`.
One value, so the displayed and charged prices cannot drift. The alternative, a
Stripe Price ID, would need either a second env var for the display price or a
Stripe call at build time.

*Trade-off:* Stripe's product reports show no catalogue product. Pre-orders are
found by the `product=chore-audit-preorder` metadata instead.

*Revisit when:* there is more than one price, or coupons are wanted.

### 5. A plain HTML form and a redirect

The buy button is a `<form method="post">`. The route answers with `303` to
Stripe. It works without JavaScript, has no loading state to get wrong, and
leaves nothing to hydrate. Every outcome a person can reach is a page:
`/closed` or `/checkout-error`.

### 6. Static pages, configuration read at build time

All content pages are prerendered. The home page revalidates hourly so the buy
button disappears when the ship-by date passes. The checkout route enforces the
same rule on every request, so a stale page can never sell after the date.

*Consequence:* changing a public setting, including the kill switch, needs a
redeploy.

### 7. The ship-by date closes sales automatically

A pre-order sold after the promised delivery date is a promise already broken.
`preordersAvailable()` is the single rule, used by both the page and the route.

### 8. Same-origin check on the checkout route

The route refuses a POST whose `Origin` (or `Referer`) host differs from the
host it arrived on. Creating a session is not dangerous in itself, but there is
no reason to let other sites trigger it. The comparison uses the request host,
not `APP_URL`, so preview deployments work.

Return URLs always use `APP_URL` and never the request host, which closes
host-header injection into Stripe redirects.

### 9. In-memory rate limiting, stated as best-effort

A shared store would be the only stateful dependency in the project. The
limiter stops one client hammering one instance; the real control is a firewall
rule at the edge (runbook). This is written in the code as well, so nobody
mistakes it for a guarantee.

### 10. Content Security Policy with `'unsafe-inline'` for scripts

Next.js emits inline bootstrap scripts. A nonce-based policy would force every
page to render dynamically. The pages run no third-party script and render no
user input, so the practical risk is low.

*Must change in milestone 2:* the audit renders user-entered text. Move to
nonces for those routes.

### 11. Structured logs, no error-tracking SDK yet

Every decision point logs one JSON line with an `event` name. That is enough to
operate a single-route funnel and adds no dependency.

*Revisit when:* there is logic whose failures would not show up in Stripe or in
a failed request. Sentry is the planned addition.

### 12. No personal data in logs or on the success page

Logs carry Stripe object IDs only. The success page confirms the payment but
does not echo the buyer's email, so a shared link reveals nothing.

### 13. TypeScript 6.0, not 7.x

`npm` resolves `typescript@latest` to 7.0, but `typescript-eslint` 8 declares
support for versions below 6.1. Linting is part of CI, so the supported version
wins.

*Revisit when:* `eslint-config-next` ships a `typescript-eslint` that supports 7.

### 14. One codebase, one product per deployment

`PRODUCT` selects what a deployment sells. Each product is a folder under
`src/products/` with a typed `ProductDefinition` and its own home page
component. Everything with a rule in it (configuration, checkout, the webhook,
the pre-order terms, the legal templates) is shared.

The alternative was a copy of the repository per product. That duplicates the
payment and webhook code, and a security fix then has to be made in every copy.
A single deployment serving several products by hostname was also rejected: it
would make every page dynamic and put two products' failures on one deployment.

Landing copy is not forced into a shared schema. The two pages make different
arguments (one cites survey data, the other answers "why not a free list?"),
and an abstraction drawn from two examples would fit neither the third time.
Shared wording is limited to what must stay identical: the buy form and the
five pre-order promises.

*Guarantee kept:* with `PRODUCT` unset the app renders The Chore Audit, and its
pages are text-identical to the single-product version this replaced.

*Consequence:* products that share a Stripe account receive each other's
webhook events. Session log records carry `product` from the session metadata.
Count pre-orders by Stripe metadata, never by log lines.

*Revisit when:* a product reaches milestone 2. Fulfilment code is not shared
by nature, and a product with a database may be better served by its own
repository that keeps this one as its pre-sell front.

## Module map

| Module | Responsibility |
| --- | --- |
| `lib/env.ts` | Parse and validate configuration. `preordersAvailable()` |
| `lib/checkout.ts` | Build the Checkout Session request. Pure |
| `lib/webhook.ts` | Map a verified Stripe event to a log record. Pure |
| `lib/stripe.ts` | The one Stripe client |
| `lib/http.ts` | Same-origin check, client address |
| `lib/rate-limit.ts` | Fixed-window limiter |
| `lib/logger.ts` | JSON logging |
| `lib/format.ts` | Price and date formatting |
| `lib/product.ts` | The product this deployment sells |
| `products/types.ts` | Product keys, `ProductDefinition`, home page props |
| `products/registry.ts` | Every product, exhaustive by type |
| `products/home-pages.tsx` | Each product's landing page, exhaustive by type |
| `products/<key>/product.ts` | A product's facts and copy, with the sources behind any statistic |
| `products/<key>/home.tsx` | A product's landing page |
| `components/preorder-terms.tsx` | The five pre-order promises, shared by every product |

Route handlers contain only orchestration. Anything with a rule in it lives in
`lib/` and is tested there.

## Testing

| Layer | Covered by |
| --- | --- |
| Configuration rules | `tests/env.test.ts` |
| Formatting, origin check, limiter, checkout request | `tests/lib.test.ts` |
| Webhook signature handling and event mapping | `tests/webhook.test.ts`, using Stripe's own test-signature helper |
| Checkout route: every branch | `tests/checkout-route.test.ts`, Stripe client mocked |
| Product registry, each landing page's markup, per-product checkout request | `tests/products.test.ts`, pages rendered to static markup |

Not covered: a real payment, and rendering in a browser. Both are manual steps
in the launch checklist.

## Security summary

- Secrets are server-only, validated for shape, and never logged.
- Webhook payloads are verified against the signing secret before parsing.
- Session IDs from the URL are format-checked before being sent to Stripe.
- Security headers on every response: CSP, HSTS, `X-Frame-Options: DENY`,
  `nosniff`, a referrer policy and a permissions policy.
- Use a Stripe **restricted key** in production with write access to Checkout
  Sessions only.
