"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogIn, UserPlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
}

/**
 * AuthGuard component - wraps content that requires authentication.
 * Shows a friendly sign-in prompt instead of redirecting to login.
 */
export function AuthGuard({ 
  children, 
  fallbackTitle = "Sign In Required",
  fallbackDescription = "Please sign in to access this feature.",
  fallbackIcon: FallbackIcon = LogIn
}: AuthGuardProps) {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 max-w-md"
        >
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto">
            <FallbackIcon className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">{fallbackTitle}</h2>
            <p className="text-muted-foreground font-medium">
              {fallbackDescription}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg" className="rounded-xl px-8 font-bold gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl px-8 font-bold gap-2">
              <Link href="/login?mode=signup">
                <UserPlus className="h-4 w-4" />
                Create Account
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}

/**
 * Simple loading placeholder for pages
 */
export function PageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
