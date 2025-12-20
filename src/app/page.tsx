"use client";

import Dashboard from "./(main)/page";
import { Navbar } from "@/components/Navbar";

export default function RootPage() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto p-4 max-w-md md:max-w-4xl pb-20 md:pb-4 pt-12 md:pt-28">
        <Dashboard />
      </main>
    </>
  );
}
