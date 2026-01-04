import { Heart } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="hidden md:block border-t border-border/30 bg-linear-to-b from-background to-muted/20 py-8 mt-auto">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <LogoMark className="h-8 w-8" variant="dark" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">
                  <span className="text-emerald-600 dark:text-emerald-400">Hostel</span>
                  <span>Mate</span>
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live Better, Together
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="flex items-center gap-6 text-sm">
            <Link 
              href="/guide" 
              className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              Guide
            </Link>
            <Link 
              href="/fairness-info" 
              className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              How It Works
            </Link>
            <Link 
              href="/feedback" 
              className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              Feedback
            </Link>
          </nav>

          {/* Social & Made with */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Made with</span>
              <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
              <span className="text-xs text-muted-foreground">for students</span>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border/20">
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <span>© {new Date().getFullYear()} HostelMate</span>
          </div>
          
          <p className="text-xs text-emerald-600/50 dark:text-emerald-400/50 italic">
            "The best among you are those most beneficial to others"
          </p>
        </div>
      </div>
    </footer>
  );
}
