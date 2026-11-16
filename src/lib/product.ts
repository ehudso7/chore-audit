import { getProduct } from '@/products/registry';
import type { ProductDefinition } from '@/products/types';
import { getConfig } from './env';

/** The product this deployment sells, as chosen by the PRODUCT variable. */
export function getActiveProduct(): ProductDefinition {
  return getProduct(getConfig().productKey);
}
