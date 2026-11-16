# Runbook

How to launch, measure, operate and shut down the pre-sell.

## Launch checklist

Do these in order. Do not skip the test payment.

### Decisions only you can make

- [ ] **Ship-by date.** You are promising delivery by this date and refunding
      everyone if you miss it. Pick one you can keep.
- [ ] **Price.** `1900` cents is an untested assumption.
- [ ] **Refund terms.** The template promises refunds before delivery and for 14
      days after. Change `src/app/legal/refunds/page.tsx` if you want different.
- [ ] **Legal review** of the three pages under `src/app/legal/`.
- [ ] **Sales tax.** Decide whether to enable Stripe Tax.
- [ ] **Name.** Run a trademark and domain search on the working name.

### Stripe

- [ ] Business details and statement descriptor completed in the Stripe account.
- [ ] Customer emails for **successful payments** and **refunds** switched on.
      The success page tells buyers a receipt has been emailed, and that is only
      true with this setting on.
- [ ] A **restricted key** created with write access to Checkout Sessions.
- [ ] A webhook endpoint added for `https://<your-domain>/api/webhooks/stripe`,
      subscribed to:
      `checkout.session.completed`,
      `checkout.session.async_payment_succeeded`,
      `checkout.session.async_payment_failed`,
      `charge.refunded`,
      `charge.dispute.created`.
- [ ] The Stripe account's notification email is one you read. Stripe emails
      it when a webhook endpoint keeps failing.

### Hosting (Vercel)

- [ ] Project created from the repository. No build settings to change.
- [ ] Environment variables set for **Production** from `.env.example`.
      Use test-mode Stripe values for **Preview**, with `APP_URL` set to the
      preview's own origin.
- [ ] Custom domain attached, and `APP_URL` set to exactly that origin.
- [ ] Web Analytics enabled for the project.
- [ ] A firewall rate-limit rule on `POST /api/checkout`. Confirm the feature
      and its limits on your plan in the Vercel dashboard; this repository does
      not configure it.

### Verify before sending traffic

- [ ] `GET /api/health` returns `{"status":"ok","preordersAvailable":true,"stripeMode":"live"}`.
- [ ] One **test-mode** payment on a preview deployment, end to end.
- [ ] One **live** payment with your own card: receipt arrives, `/success`
      confirms, `preorder.paid` appears in the logs, the webhook shows as
      delivered in Stripe. Then refund it from the Stripe Dashboard and confirm
      `preorder.refunded` is logged.
- [ ] An uptime monitor pointed at `/api/health`, alerting on anything other
      than HTTP 200.

## The launch gate

The reason this milestone exists. Decide the numbers before you look at
results.

| Measure | Where it comes from |
| --- | --- |
| Visitors | Vercel Web Analytics, unique visitors to `/` |
| Pre-orders | Stripe Dashboard, payments with metadata `product=chore-audit-preorder`, net of refunds |
| Conversion | Pre-orders divided by visitors |
| Cost per pre-order | Ad spend divided by pre-orders |

**Proposed gate:** send about 500 visitors who match the target buyer. Build
the product if at least 2% pre-order (10 of 500) and the cost per pre-order is
below the price.

These thresholds are a starting proposal, not an industry benchmark. With 500
visitors the result is noisy: 10 pre-orders is consistent with a true rate of
roughly 1% to 3.6%. Treat a result near the line as "run it again", not as a
verdict.

**If the gate fails:** close pre-orders, refund everyone (below), and say so
plainly in an email. That promise is on the landing page.

## Routine operations

### Refund one buyer

Stripe Dashboard, open the payment, Refund, full amount. The buyer gets
Stripe's refund email. `preorder.refunded` appears in the logs.

### Refund everyone

Email buyers first so the refund is not a surprise. Then refund each payment
from the Dashboard, or for more than a handful, script it against the Stripe
API: find the payments by the `product=chore-audit-preorder` metadata, then
create a refund for each. No such script is included here. Write it when it is
needed and run it in test mode first.

### Stop taking pre-orders

Set `PREORDERS_OPEN=false` in Production and redeploy. The button is replaced
by a notice and the checkout route sends anyone with a stale page to `/closed`.
Sales also stop by themselves the day after `SHIP_BY_DATE`.

### Change the price or the ship-by date

Change the variable and redeploy. Existing buyers keep the terms they bought
under: each payment records its own `ship_by` in metadata. **Moving the date
later for people who already paid requires their agreement or a refund.**

### Roll back a bad deploy

Promote the previous production deployment in Vercel. There is no database and
no migration, so a rollback is always safe.

## Log events

Search the host's logs by `event`.

| Event | Level | Meaning | Action |
| --- | --- | --- | --- |
| `checkout.session_created` | info | A buyer was sent to Stripe | None |
| `checkout.rejected_closed` | info | Attempt while closed | None |
| `checkout.rejected_cross_origin` | warn | POST from another site, or with no Origin | Ignore unless sustained |
| `checkout.rate_limited` | warn | One address over 10 attempts a minute | Check for abuse |
| `checkout.session_failed` | error | Stripe refused or was unreachable | See incidents |
| `checkout.misconfigured` | error | Bad environment variable | Fix and redeploy |
| `preorder.paid` | info | Money received | None |
| `preorder.awaiting_payment` | info | Delayed payment method started | None |
| `preorder.payment_failed` | warn | Delayed payment failed | None; the buyer was not charged |
| `preorder.refunded` | info | Refund issued | None |
| `preorder.disputed` | warn | Chargeback opened | Respond in Stripe within the deadline |
| `webhook.invalid_signature` | warn | Unsigned or mis-signed request | See incidents if sustained |
| `webhook.misconfigured` | error | Signing secret missing | Fix and redeploy; Stripe retries |
| `success.lookup_failed` | warn | Could not confirm a session | Check Stripe status |
| `health.misconfigured` | error | Health check found a bad setting | Fix and redeploy |

## Incidents

### Buyers cannot start checkout (`checkout.session_failed`)

1. Read the `error` field. `Invalid API Key` means the key is wrong, revoked or
   lacks permission. Anything about a parameter means the request was rejected
   and is a code fault.
2. Check https://status.stripe.com.
3. If it will not be fixed within minutes, set `PREORDERS_OPEN=false` and
   redeploy, so visitors see "closed" and not an error.

No buyer is charged in this state. A charge only happens on Stripe's page.

### Webhook deliveries failing in Stripe

Payments are unaffected: the webhook only logs. Fix the cause (usually a
rotated signing secret), then use "Resend" in the Stripe Dashboard if you want
the log lines.

### Sustained `webhook.invalid_signature`

Either the signing secret does not match the endpoint, or someone is probing
the URL. Compare the secret with the one shown for the endpoint in Stripe.
Probing needs no action: unsigned requests are rejected before parsing.

### A secret was exposed

Roll the key in the Stripe Dashboard, update the environment variable, redeploy.
Review recent API activity in Stripe for anything you did not initiate.

## Upgrades

- `stripe`: a major version moves the pinned API version. Read the changelog,
  run the tests, then repeat the test payment.
- `next`: run `npm run check`, then load every page in a preview.
- Run `npm audit --omit=dev` monthly. CI fails on high or critical findings.
