import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Hero / welcome section matching sahaya-operations-suite.
 * Gradient bg, grid overlay, radial glow; content in relative z-10 container.
 */
interface HeroSectionProps {
  children: ReactNode;
  className?: string;
}

export function HeroSection({ children, className }: HeroSectionProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden py-8',
        className
      )}
    >
      {/* Subtle gradient bg */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, hsl(285 30% 96%) 0%, hsl(30 5% 98%) 100%)',
        }}
      />
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(285 45% 55% / 0.025) 1px, transparent 1px),
            linear-gradient(90deg, hsl(285 45% 55% / 0.025) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-20%',
          right: '10%',
          width: 400,
          height: 300,
          background:
            'radial-gradient(ellipse, hsl(32 95% 52% / 0.06) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6">{children}</div>
    </section>
  );
}
