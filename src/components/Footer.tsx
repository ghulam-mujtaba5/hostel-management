import Link from "next/link";
import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-border/40 bg-muted/50 mt-8 py-8">
      <div className="container relative max-w-6xl mx-auto px-4">
        {/* Main Footer Links */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-8">
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-foreground tracking-wide">App</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/tasks" className="text-muted-foreground hover:text-primary transition-colors">
                  Tasks
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-muted-foreground hover:text-primary transition-colors">
                  History
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-foreground tracking-wide">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/spaces" className="text-muted-foreground hover:text-primary transition-colors">
                  Spaces
                </Link>
              </li>
              <li>
                <Link href="/preferences" className="text-muted-foreground hover:text-primary transition-colors">
                  Preferences
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-foreground tracking-wide">Help</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/guide" className="text-muted-foreground hover:text-primary transition-colors">
                  Guide
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-muted-foreground hover:text-primary transition-colors">
                  Feedback
                </Link>
              </li>
              <li>
                <Link href="/fairness-info" className="text-muted-foreground hover:text-primary transition-colors">
                  Algorithm Info
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-foreground tracking-wide">App Info</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-muted-foreground text-xs">Version 1.0.0</span>
              </li>
              <li>
                <span className="text-muted-foreground text-xs">PWA Enabled</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-border/40 pt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            © {currentYear} HostelMate. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500 inline" /> for students
          </p>
        </div>
      </div>
    </footer>
  );
}
