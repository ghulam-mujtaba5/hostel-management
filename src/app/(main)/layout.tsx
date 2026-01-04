"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Decorative background elements - subtle for app feel */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500/3 rounded-full blur-3xl" />
      </div>
      
      <Navbar />
      
      <main 
        id="main-content"
        role="main"
        className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-8 pt-20 md:pt-24 max-w-7xl flex-1"
        tabIndex={-1}
      >
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Footer only on desktop - mobile has bottom nav */}
      <Footer />
    </div>
  );
}
