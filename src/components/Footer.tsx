import { Heart, Sparkles, ExternalLink, Moon } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="hidden md:block border-t border-border/30 bg-background/50 backdrop-blur-sm py-6 mt-auto">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Version */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="font-bold text-sm">HostelMate</span>
            </div>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              v2.0
            </span>
          </div>

          {/* Quick Links */}
          <nav className="flex items-center gap-6 text-xs">
            <Link 
              href="/guide" 
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              User Guide
            </Link>
            <Link 
              href="/fairness-info" 
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              How It Works
            </Link>
            <Link 
              href="/feedback" 
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Feedback
            </Link>
          </nav>

          {/* Made with Love - Islamic Touch */}
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> & <Moon className="h-3 w-3 text-emerald-500" /> for hostelites
          </p>
        </div>
        
        {/* Islamic Quote & Legal */}
        <div className="flex flex-col items-center gap-3 mt-4 pt-4 border-t border-border/20">
          <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 italic">
            "Cleanliness is half of faith" — Prophet Muhammad ﷺ
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Terms of Service
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="#" className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-[10px] text-muted-foreground/40">
              © 2026 HostelMate
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
