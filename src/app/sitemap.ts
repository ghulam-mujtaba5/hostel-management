import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hostelmate.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  // Static pages with their priorities and change frequencies
  const staticPages = [
    { route: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { route: '/login', priority: 0.8, changeFrequency: 'monthly' as const },
    { route: '/signup', priority: 0.8, changeFrequency: 'monthly' as const },
  ];

  // Public marketing/info pages (if any)
  const publicPages: typeof staticPages = [
    // Add public pages here as they are created
    // { route: '/features', priority: 0.7, changeFrequency: 'monthly' as const },
    // { route: '/pricing', priority: 0.7, changeFrequency: 'monthly' as const },
    // { route: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
  ];

  const allPages = [...staticPages, ...publicPages];

  return allPages.map(({ route, priority, changeFrequency }) => ({
    url: `${BASE_URL}${route}`,
    lastModified: currentDate,
    changeFrequency,
    priority,
  }));
}
