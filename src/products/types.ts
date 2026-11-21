/**
 * One codebase sells more than one pre-order. Each deployment sells exactly
 * one product, chosen by the PRODUCT environment variable (see lib/env.ts).
 *
 * A product is two things:
 *  - a ProductDefinition: the facts shared code needs (name, Stripe tag, the
 *    wording used in checkout, the footer and the legal templates);
 *  - a home page component, registered in home-pages.tsx.
 *
 * Landing copy is deliberately NOT forced into a common schema. Two products
 * with different arguments make a poor basis for an abstraction; each owns its
 * page and shares only the parts that must stay identical (the buy form and
 * the pre-order terms).
 */

export const PRODUCT_KEYS = ['chore-audit', 'anime-starter-pack'] as const;
export type ProductKey = (typeof PRODUCT_KEYS)[number];

/** Used when PRODUCT is unset, so existing deployments keep working unchanged. */
export const DEFAULT_PRODUCT_KEY: ProductKey = 'chore-audit';

export interface ProductDefinition {
  readonly key: ProductKey;
  readonly name: string;
  /** The landing page headline. Also used in the page title. */
  readonly tagline: string;
  /** Meta description. Must not state a price: the price is configuration. */
  readonly description: string;
  /** Recorded on the Stripe payment so pre-orders are easy to filter. */
  readonly stripeProductKey: string;
  /** Used when PRICE_CENTS is not set. An untested assumption, not a finding. */
  readonly defaultPriceCents: number;
  /** What one payment covers, as in "One-time payment per household." */
  readonly purchaseUnit: string;
  /** One sentence shown as the product description on Stripe Checkout. */
  readonly checkoutSummary: string;
  /** What arrives by email on delivery, as in "Your access link arrives…". */
  readonly deliverable: string;
  /** Shown in the site footer after the copyright line. */
  readonly footerNote: string;
  /** Product-specific wording for the legal page templates. */
  readonly legal: {
    /** Completes "A pre-order of <name>: …". No trailing full stop. */
    readonly whatYouAreBuying: string;
    readonly usingIt: string;
    /** Completes "<name> is …". */
    readonly whatItIsNot: string;
    readonly privacyAtLaunch: {
      readonly heading: string;
      readonly body: string;
    };
  };
}

/** What every product's home page receives. All values are display-ready. */
export interface HomePageProps {
  readonly product: ProductDefinition;
  readonly available: boolean;
  readonly price: string;
  readonly shipBy: string;
  readonly supportEmail: string;
}
