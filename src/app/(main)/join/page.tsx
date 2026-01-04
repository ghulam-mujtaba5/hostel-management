"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Redirect from /join to /spaces/join for cleaner URL structure
 * The actual join functionality is at /spaces/join or /join/[code]
 */
export default function JoinRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/spaces/join");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  );
}
