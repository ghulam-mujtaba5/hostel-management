"use client";

import Link from "next/link";
import { Home, CheckSquare, User, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/leaderboard", label: "Rank", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="mx-auto flex max-w-md items-center justify-around md:max-w-4xl md:justify-between">
        <Link href="/" className="hidden text-xl font-bold md:block text-primary">
          🏠 HostelMate
        </Link>
        <div className="flex w-full justify-around md:w-auto md:gap-6">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || 
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 text-xs font-medium transition-all hover:text-primary md:flex-row md:text-sm",
                  isActive ? "text-primary scale-105" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
