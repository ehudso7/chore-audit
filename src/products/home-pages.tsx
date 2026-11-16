import type { ReactElement } from 'react';
import { AnimeStarterPackHome } from './anime-starter-pack/home';
import { ChoreAuditHome } from './chore-audit/home';
import type { HomePageProps, ProductKey } from './types';

/**
 * The landing page for each product. Exhaustive by type, like the registry:
 * a product without a page does not compile.
 */
export const homePages: Readonly<
  Record<ProductKey, (props: HomePageProps) => ReactElement>
> = {
  'chore-audit': ChoreAuditHome,
  'anime-starter-pack': AnimeStarterPackHome,
};
