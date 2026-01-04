import { Heart, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="hidden md:block border-t border-border/30 bg-background/50 backdrop-blur-sm py-4 mt-auto">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              HostelMate
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span>v2.0</span>
          </div>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for students
          </p>
        </div>
      </div>
    </footer>
  );
}
