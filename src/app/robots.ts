import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digitax.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/features', '/how-it-works', '/security', '/faq', '/login', '/register'],
        disallow: [
          '/dashboard',
          '/documents',
          '/transactions',
          '/reconciliation',
          '/gst',
          '/assistant',
          '/review',
          '/exports',
          '/settings',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
