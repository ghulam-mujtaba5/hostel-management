"use client";

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  minHeight?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  minHeight = "60vh"
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-4 py-12", `min-h-[${minHeight}]`)}>
      {/* Illustration/Icon */}
      {Icon && (
        <div className="mb-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <Icon className="h-16 w-16 text-primary" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-md space-y-3 mb-8">
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          action.href ? (
            <Button asChild size="lg" className="rounded-xl">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button size="lg" className="rounded-xl" onClick={action.onClick}>
              {action.label}
            </Button>
          )
        )}

        {secondaryAction && (
          secondaryAction.href ? (
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-xl" 
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
