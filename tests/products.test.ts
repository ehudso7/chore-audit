import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildCheckoutParams } from '@/lib/checkout';
import { parseConfig } from '@/lib/env';
import { homePages } from '@/products/home-pages';
import { allProducts, getProduct } from '@/products/registry';
import { PRODUCT_KEYS, type HomePageProps, type ProductKey } from '@/products/types';

const baseEnv = {
  APP_URL: 'https://example.com',
  SHIP_BY_DATE: '2027-01-31',
  SUPPORT_EMAIL: 'help@example.com',
  LEGAL_ENTITY_NAME: 'Example LLC',
};

/** Tags stripped and entities decoded, so assertions read like the page does. */
function visibleText(markup: string): string {
  return markup
    .replace(/<!--.*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderHome(key: ProductKey, overrides: Partial<HomePageProps> = {}): string {
  const props: HomePageProps = {
    product: getProduct(key),
    available: true,
    price: 'PRICE_TOKEN',
    shipBy: 'January 31, 2027',
    supportEmail: 'help@example.com',
    ...overrides,
  };
  return renderToStaticMarkup(createElement(homePages[key], props));
}

describe('product registry', () => {
  it('registers every key under its own key', () => {
    expect(allProducts().map((product) => product.key)).toEqual([...PRODUCT_KEYS]);
    for (const key of PRODUCT_KEYS) expect(getProduct(key).key).toBe(key);
  });

  it('gives every product a distinct name and Stripe tag', () => {
    const products = allProducts();
    expect(new Set(products.map((p) => p.name)).size).toBe(products.length);
    expect(new Set(products.map((p) => p.stripeProductKey)).size).toBe(products.length);
  });

  it.each(PRODUCT_KEYS)('%s has a default price the configuration accepts', (key) => {
    expect(() => parseConfig({ ...baseEnv, PRODUCT: key })).not.toThrow();
  });

  it.each(PRODUCT_KEYS)('%s states no price in its fixed copy', (key) => {
    const product = getProduct(key);
    const fixedCopy = [
      product.tagline,
      product.description,
      product.checkoutSummary,
      product.footerNote,
      ...Object.values(product.legal).flatMap((value) =>
        typeof value === 'string' ? [value] : Object.values(value),
      ),
    ].join(' ');
    expect(fixedCopy).not.toMatch(/[$£€]\s?\d/);
  });
});

describe.each(PRODUCT_KEYS)('%s home page', (key) => {
  const product = getProduct(key);

  it('shows the headline, the configured price and the delivery promise', () => {
    const text = visibleText(renderHome(key));
    expect(text).toContain(product.tagline);
    expect(text).toContain('Pre-order for PRICE_TOKEN');
    expect(text).toContain(`One-time payment per ${product.purchaseUnit}.`);
    expect(text).toContain(`Your ${product.deliverable} arrives by email on or before January 31, 2027`);
    expect(text).toContain('every pre-order is refunded in full');
  });

  it('takes its price only from configuration', () => {
    const text = visibleText(renderHome(key));
    expect(text).not.toMatch(/[$£€]\s?\d/);
  });

  it('posts the buy form to the checkout route', () => {
    const markup = renderHome(key);
    expect(markup).toContain('action="/api/checkout"');
    expect(markup).toContain('method="post"');
  });

  it('replaces the buy button with a notice when pre-orders are closed', () => {
    const markup = renderHome(key, { available: false });
    expect(markup).not.toContain('action="/api/checkout"');
    expect(visibleText(markup)).toContain('Pre-orders are closed right now.');
  });
});

describe('Anime Starter Pack', () => {
  const product = getProduct('anime-starter-pack');
  const config = parseConfig({ ...baseEnv, PRODUCT: 'anime-starter-pack' });
  const params = buildCheckoutParams(config);

  it('charges the pack price under its own name and Stripe tag', () => {
    const item = params.line_items?.[0];
    expect(item?.price_data?.unit_amount).toBe(900);
    expect(item?.price_data?.product_data?.name).toBe('Anime Starter Pack (pre-order)');
    expect(item?.price_data?.product_data?.description).toBe(
      'One-time purchase of one pack for one recipient. Delivered by January 31, 2027 or refunded in full.',
    );
    const expected = { product: 'anime-starter-pack-preorder', ship_by: '2027-01-31' };
    expect(params.metadata).toEqual(expected);
    expect(params.payment_intent_data?.metadata).toEqual(expected);
  });

  it('states the pre-order promise where the buyer pays', () => {
    const submit = params.custom_text?.submit;
    const message = submit && typeof submit === 'object' ? (submit.message ?? '') : '';
    expect(message).toContain('Anime Starter Pack is not available yet');
    expect(message.length).toBeLessThanOrEqual(1200);
  });

  it('says it is independent and does not include the shows', () => {
    expect(product.footerNote).toContain('not affiliated with');
    expect(product.legal.whatYouAreBuying).toContain('does not include access to any anime');
    const text = visibleText(renderHome('anime-starter-pack'));
    expect(text).toContain('Does the pack include the shows themselves? No.');
  });

  it('limits purchase to adults in the terms and on the page', () => {
    expect(product.legal.usingIt).toContain('18 or older');
    expect(visibleText(renderHome('anime-starter-pack'))).toContain('Anyone 18 or older.');
  });

  it('makes no promise about enjoyment and quotes no customers', () => {
    const text = visibleText(renderHome('anime-starter-pack')).toLowerCase();
    for (const pattern of [/\bguarantee/, /\btestimonial/, /\bcustomers love\b/, /\brated\b/]) {
      expect(text).not.toMatch(pattern);
    }
  });
});
