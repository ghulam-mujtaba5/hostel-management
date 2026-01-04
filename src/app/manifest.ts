import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HostelMate - Smart Duty Management',
    short_name: 'HostelMate',
    description: 'Intelligent hostel duty management with AI-powered fair task distribution, gamification, and team collaboration',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    dir: 'ltr',
    categories: ['productivity', 'lifestyle', 'utilities'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/dashboard.png',
        sizes: '1280x720',
        type: 'image/png',
        label: 'Dashboard view showing task overview',
        form_factor: 'wide',
      },
      {
        src: '/screenshots/mobile.png',
        sizes: '390x844',
        type: 'image/png',
        label: 'Mobile view of the app',
        form_factor: 'narrow',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your task dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/dashboard.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'My Tasks',
        short_name: 'Tasks',
        description: 'View your assigned tasks',
        url: '/tasks',
        icons: [{ src: '/icons/tasks.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Leaderboard',
        short_name: 'Leaderboard',
        description: 'Check the leaderboard',
        url: '/leaderboard',
        icons: [{ src: '/icons/leaderboard.png', sizes: '96x96', type: 'image/png' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
