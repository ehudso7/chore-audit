import { animeStarterPack } from './anime-starter-pack/product';
import { choreAudit } from './chore-audit/product';
import type { ProductDefinition, ProductKey } from './types';

/**
 * Every product this codebase can sell. The Record type makes this exhaustive:
 * adding a key to PRODUCT_KEYS without registering it here is a compile error.
 */
const products: Readonly<Record<ProductKey, ProductDefinition>> = {
  'chore-audit': choreAudit,
  'anime-starter-pack': animeStarterPack,
};

export function getProduct(key: ProductKey): ProductDefinition {
  return products[key];
}

export function allProducts(): readonly ProductDefinition[] {
  return Object.values(products);
}
