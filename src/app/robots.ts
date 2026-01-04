import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hostelmate.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/duties/',
          '/profile/',
          '/settings/',
          '/admin/',
          '/tasks/',
          '/leaderboard/',
          '/insights/',
          '/spaces/',
          '/queue/',
          '/notes/',
          '/history/',
          '/feedback/',
          '/issues/',
          '/team/',
          '/guide/',
          '/preferences/',
          '/services/',
          '/fairness-info/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
