import { Metadata } from 'next';

// Base metadata configuration
const siteConfig = {
  name: 'HostelMate',
  description: 'Smart duty management for shared living spaces. AI-powered task distribution, gamification, and team collaboration.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://hostelmate.app',
  ogImage: '/og-image.png',
  keywords: [
    'hostel management',
    'duty management',
    'task management',
    'shared living',
    'flatmates',
    'roommates',
    'chores',
    'housework',
    'fair distribution',
    'gamification',
    'leaderboard',
    'team collaboration'
  ],
};

// Helper to generate page metadata
export function generatePageMetadata(
  title: string,
  description?: string,
  path?: string,
  options?: {
    noIndex?: boolean;
    image?: string;
  }
): Metadata {
  const pageTitle = title === siteConfig.name 
    ? title 
    : `${title} | ${siteConfig.name}`;
  
  const pageDescription = description || siteConfig.description;
  const pageUrl = path ? `${siteConfig.url}${path}` : siteConfig.url;
  const pageImage = options?.image || siteConfig.ogImage;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: siteConfig.keywords,
    authors: [{ name: 'HostelMate Team' }],
    creator: 'HostelMate',
    publisher: 'HostelMate',
    robots: options?.noIndex 
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: pageUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

// Pre-defined metadata for common pages
export const pageMetadata = {
  home: generatePageMetadata(
    'HostelMate - Smart Duty Management',
    'Intelligent hostel duty management with AI-powered fair task distribution, gamification, and team collaboration.',
    '/'
  ),
  login: generatePageMetadata(
    'Sign In',
    'Sign in to your HostelMate account to manage your hostel duties.',
    '/login'
  ),
  tasks: generatePageMetadata(
    'Tasks',
    'View and manage your hostel tasks. Track progress, earn points, and collaborate with flatmates.',
    '/tasks'
  ),
  leaderboard: generatePageMetadata(
    'Leaderboard',
    'See who\'s leading the pack! View rankings and contributions in your hostel.',
    '/leaderboard'
  ),
  profile: generatePageMetadata(
    'Profile',
    'View and edit your HostelMate profile. Track your achievements and statistics.',
    '/profile'
  ),
  spaces: generatePageMetadata(
    'Spaces',
    'Manage your hostel spaces. Create new spaces or join existing ones with your flatmates.',
    '/spaces'
  ),
  feedback: generatePageMetadata(
    'Feedback',
    'Give and receive feedback on task completion. Help build a better hostel community.',
    '/feedback'
  ),
  guide: generatePageMetadata(
    'User Guide',
    'Learn how to use HostelMate effectively. Tips, tutorials, and best practices for hostel management.',
    '/guide'
  ),
};

export default siteConfig;
