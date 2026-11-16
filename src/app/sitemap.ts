import type { MetadataRoute } from 'next';
import { getConfig } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const { appUrl } = getConfig();
  return ['/', '/legal/terms', '/legal/refunds', '/legal/privacy'].map((path) => ({
    url: `${appUrl}${path}`,
  }));
}
