import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Section block matching sahaya-operations-suite elevated wrapper.
 * Optional title; content in rounded-2xl card-style container.
 */
interface SectionWrapperProps {
  title?: string;
  children: ReactNode;
  className?: string;
  /** If true, wrap content in elevated card (gradient bg, border, shadow) */
  elevated?: boolean;
}

export function SectionWrapper({
  title,
  children,
  className,
  elevated = true,
}: SectionWrapperProps) {
  return (
    <section className={cn('py-8', className)}>
      <div className="mx-auto max-w-7xl px-6">
        {title && (
          <h2 className="mb-4 text-base font-bold tracking-tight text-foreground">
            {title}
          </h2>
        )}
        {elevated ? (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
