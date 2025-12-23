import Link from "next/link";
import { Github, Twitter, Linkedin, Heart, Mail, MapPin, Building2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative border-t border-border/40 bg-gradient-to-b from-background to-muted/30">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-50" />
      
      <div className="container relative max-w-6xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Column */}
            <div className="lg:col-span-1 space-y-6">
              <Logo size="sm" variant="gradient" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Making hostel life easier, fairer, and more fun through smart task management and community building.
              </p>
              <div className="flex items-center gap-3">
                <Link 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="h-9 w-9 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                >
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </Link>
                <Link 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="h-9 w-9 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                >
                  <Twitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="h-9 w-9 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                >
                  <Linkedin className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </div>
            </div>
            
            {/* Links Columns */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground tracking-wide">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/guide" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group">
                    <span>How It Works</span>
                  </Link>
                </li>
                <li>
                  <Link href="/fairness-info" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
                    Fairness Algorithm
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
                    Feedback
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground tracking-wide">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/guide" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
                    User Guide
                  </Link>
                </li>
                <li>
                  <Link href="/spaces" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
                    Join a Space
                  </Link>
                </li>
                <li>
                  <Link href="/spaces/create" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
                    Create Space
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
                    Your Profile
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground tracking-wide">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-t border-border/40 py-6">
          <p className="text-xs text-muted-foreground">
            © {currentYear} HostelMate. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500 inline" /> for students everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
