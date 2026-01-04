import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-950 p-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 Visual */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-indigo-600/20">404</h1>
        </div>

        {/* Message */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-white">
            Page not found
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. 
            Check the URL or navigate back to a known page.
          </p>
        </div>

        {/* Search Suggestions */}
        <div className="bg-slate-800/30 rounded-lg p-6 mb-8 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center justify-center gap-2">
            <Search className="h-4 w-4" />
            Popular destinations
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/tasks', label: 'Tasks' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/settings', label: 'Settings' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-full transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            size="lg"
          >
            <Link href="/">
              <Home className="h-5 w-5" />
              Go to homepage
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-800"
            size="lg"
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-5 w-5" />
              Go back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
