import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { BetaBanner } from "@/components/BetaBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HostelMate - Smart Duty Management",
  description: "Intelligent hostel duty management with AI-powered fair task distribution, gamification, and team collaboration",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HostelMate",
    startupImage: "/icon.svg",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  keywords: ["hostel", "duties", "task management", "flatmates", "roommates", "chores"],
  authors: [{ name: "HostelMate Team" }],
  openGraph: {
    title: "HostelMate - Smart Duty Management",
    description: "Fair and fun way to manage hostel duties",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-screen bg-background antialiased")}>
        <ThemeProvider>
          <AuthProvider>
            <BetaBanner />
            <ToastProvider />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
