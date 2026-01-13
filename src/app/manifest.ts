import { MetadataRoute } from 'next';

// Cache bust version - increment when icons change
const ICON_VERSION = 'v3';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HostelMate – Live Better, Together',
    short_name: 'HostelMate',
    description: 'The smart way to manage shared living. AI-powered fair task distribution, gamification, and seamless team collaboration. Trusted by students worldwide.',
    start_url: '/?source=pwa',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    background_color: '#020817', // Slate 950 - matches dark mode
    theme_color: '#10b981', // Emerald 500 - brand primary
    orientation: 'any', // Allow both portrait and landscape for flexibility
    scope: '/',
    lang: 'en',
    dir: 'ltr',
    categories: ['productivity', 'lifestyle', 'utilities', 'education'],
    id: 'com.hostelmate.app',
    icons: [
      // SVG icon for any size (modern browsers)
      {
        src: `/icon.svg?${ICON_VERSION}`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      // Standard PNG icons for broad compatibility
      {
        src: `/icon-48.png?${ICON_VERSION}`,
        sizes: '48x48',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-72.png?${ICON_VERSION}`,
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-96.png?${ICON_VERSION}`,
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-128.png?${ICON_VERSION}`,
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-144.png?${ICON_VERSION}`,
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-152.png?${ICON_VERSION}`,
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-192.png?${ICON_VERSION}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-256.png?${ICON_VERSION}`,
        sizes: '256x256',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-384.png?${ICON_VERSION}`,
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-512.png?${ICON_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // Maskable icons for Android (with safe zone padding)
      {
        src: `/icon-maskable-192.png?${ICON_VERSION}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: `/icon-maskable-512.png?${ICON_VERSION}`,
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
        short_name: 'Home',
        description: 'View your task dashboard',
        url: '/',
        icons: [{ src: `/icons/dashboard.png?${ICON_VERSION}`, sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'My Tasks',
        short_name: 'Tasks',
        description: 'View your assigned tasks',
        url: '/tasks',
        icons: [{ src: `/icons/tasks.png?${ICON_VERSION}`, sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Create Task',
        short_name: 'New Task',
        description: 'Create a new task',
        url: '/tasks/create',
        icons: [{ src: `/icons/add.png?${ICON_VERSION}`, sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Leaderboard',
        short_name: 'Rank',
        description: 'Check the leaderboard',
        url: '/leaderboard',
        icons: [{ src: `/icons/leaderboard.png?${ICON_VERSION}`, sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'My Profile',
        short_name: 'Profile',
        description: 'View your profile and settings',
        url: '/profile',
        icons: [{ src: `/icons/profile.png?${ICON_VERSION}`, sizes: '96x96', type: 'image/png' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
