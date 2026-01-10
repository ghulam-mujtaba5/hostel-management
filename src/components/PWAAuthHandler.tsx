"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/**
 * PWAAuthHandler - Handles OAuth return flow for installed PWA
 * 
 * When a user logs in with Google OAuth from an installed PWA:
 * 1. The OAuth flow opens in the system browser
 * 2. After auth completes, the callback redirects back to the app
 * 3. This component detects if we're returning from PWA OAuth
 * 4. It cleans up the URL and ensures proper display mode
 */
export function PWAAuthHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const pwaAuth = searchParams.get("pwa_auth");
    const pwaOAuthReturn = localStorage.getItem("pwa_oauth_return");

    // Check if we're returning from PWA OAuth flow
    if (pwaAuth === "1" || pwaOAuthReturn === "true") {
      // Clean up localStorage
      localStorage.removeItem("pwa_oauth_return");
      localStorage.removeItem("pwa_redirect_path");

      // Check current display mode
      const isStandalone = 
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      // If we're in browser but should be in PWA, try to redirect back to PWA
      if (!isStandalone && pwaOAuthReturn === "true") {
        // The user came from PWA but landed in browser after OAuth
        // Try to open the PWA URL - this works on some platforms
        const cleanPath = pathname.replace(/[?&]pwa_auth=1/, "").replace(/\?$/, "");
        
        // On Android, we can try to use the app's URL scheme
        // But for web-based PWA, we just clean up the URL
        console.log("[PWA] OAuth completed, cleaning up URL");
      }

      // Clean up the URL by removing pwa_auth parameter
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("pwa_auth");
      
      const newUrl = newSearchParams.toString() 
        ? `${pathname}?${newSearchParams.toString()}`
        : pathname;

      // Use replaceState to avoid adding to history
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [searchParams, pathname, router]);

  // Also handle display mode changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Store display mode preference for consistent experience
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // Now in standalone mode
        document.documentElement.classList.add("pwa-standalone");
        document.documentElement.classList.remove("pwa-browser");
      } else {
        // Now in browser mode
        document.documentElement.classList.add("pwa-browser");
        document.documentElement.classList.remove("pwa-standalone");
      }
    };

    // Set initial class
    if (mediaQuery.matches) {
      document.documentElement.classList.add("pwa-standalone");
    } else {
      document.documentElement.classList.add("pwa-browser");
    }

    // Listen for changes
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  return null; // This component renders nothing, just handles side effects
}
