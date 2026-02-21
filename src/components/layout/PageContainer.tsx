import { ReactNode } from 'react';

/**
 * Standard page content container matching sahaya-operations-suite.
 * max-w-7xl mx-auto px-6 space-y-10
 */
interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`mx-auto max-w-7xl px-6 space-y-10 ${className}`.trim()}>
      {children}
    </div>
  );
}
