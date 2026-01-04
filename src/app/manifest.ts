import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HostelMate – Live Better, Together',
    short_name: 'HostelMate',
    description: 'The smart way to manage shared living. AI-powered fair task distribution, gamification, and seamless team collaboration. Trusted by students worldwide.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#10b981', // Emerald - trust, growth, harmony
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    dir: 'ltr',
    categories: ['productivity', 'lifestyle', 'utilities', 'education'],
    id: 'com.hostelmate.app',
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
        short_name: 'Home',
        description: 'View your task dashboard',
        url: '/',
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
        name: 'Create Task',
        short_name: 'New Task',
        description: 'Create a new task',
        url: '/tasks/create',
        icons: [{ src: '/icons/add.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Leaderboard',
        short_name: 'Rank',
        description: 'Check the leaderboard',
        url: '/leaderboard',
        icons: [{ src: '/icons/leaderboard.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'My Profile',
        short_name: 'Profile',
        description: 'View your profile and settings',
        url: '/profile',
        icons: [{ src: '/icons/profile.png', sizes: '96x96', type: 'image/png' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
