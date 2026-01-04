import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

import { HelpTooltipProvider } from "@/components/HelpTooltip";
import { NetworkStatus } from "@/components/NetworkStatus";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HostelMate – Live Better, Together | Smart Shared Living",
  description: "Transform your shared living experience. AI-powered fair task distribution, gamification, and seamless team collaboration trusted by students worldwide.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HostelMate",
    startupImage: "/icon.svg",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  keywords: ["hostel management", "shared living", "task management", "flatmates", "roommates", "chores app", "fair distribution", "student life", "coliving", "dorm management"],
  authors: [{ name: "HostelMate" }],
  openGraph: {
    title: "HostelMate – Live Better, Together",
    description: "The smart way to manage shared living. Fair task distribution powered by AI. Join thousands of students living harmoniously.",
    type: "website",
    siteName: "HostelMate",
  },
  twitter: {
    card: "summary_large_image",
    title: "HostelMate – Live Better, Together",
    description: "Transform your shared living with AI-powered fair task distribution.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" }, // Emerald 500
    { media: "(prefers-color-scheme: dark)", color: "#020817" },  // Slate 950
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={cn(inter.className, "min-h-screen bg-background antialiased")}>
        {/* Skip to main content for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-9999 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <HelpTooltipProvider>
                  <NetworkStatus />
                  <ServiceWorkerRegister />
                  <ToastProvider />
                  {children}
                </HelpTooltipProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
