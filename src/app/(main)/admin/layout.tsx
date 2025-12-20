'use client';

import { AdminGuard } from '@/components/AdminGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-muted/30">
        {children}
      </div>
    </AdminGuard>
  );
}
