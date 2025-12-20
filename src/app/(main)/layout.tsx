"use client";

import { Navbar } from "@/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto p-4 max-w-md md:max-w-4xl pb-20 md:pb-4 pt-12 md:pt-28">
        {children}
      </main>
    </>
  );
}
