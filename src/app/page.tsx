import { getConfig, preordersAvailable } from '@/lib/env';
import { formatCalendarDate, formatPrice } from '@/lib/format';
import { homePages } from '@/products/home-pages';
import { getProduct } from '@/products/registry';

// Re-render hourly so the buy button disappears once the ship-by date passes,
// without needing a redeploy.
export const revalidate = 3600;

export default function HomePage() {
  const config = getConfig();
  const Home = homePages[config.productKey];

  return (
    <Home
      product={getProduct(config.productKey)}
      available={preordersAvailable(config, new Date())}
      price={formatPrice(config.priceCents, config.currency)}
      shipBy={formatCalendarDate(config.shipByDate)}
      supportEmail={config.supportEmail}
    />
  );
}
