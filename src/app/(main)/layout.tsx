"use client";

import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="container mx-auto p-4 max-w-md md:max-w-4xl pb-20 md:pb-4 md:pt-20">
        {children}
      </main>
    </AuthProvider>
  );
}
