import type { MetadataRoute } from 'next';
import { getConfig } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/success', '/closed', '/checkout-error'],
    },
    sitemap: `${getConfig().appUrl}/sitemap.xml`,
  };
}
