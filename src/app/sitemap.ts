import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digitax.in';

  const routes = [
    '',
    '/features',
    '/how-it-works',
    '/security',
    '/faq',
    '/login',
    '/register',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : route.startsWith('/login') || route.startsWith('/register') ? 0.6 : 0.8,
  }));
}
