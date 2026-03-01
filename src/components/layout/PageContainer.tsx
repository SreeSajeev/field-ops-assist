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
    <div className={`w-full space-y-6 px-3 md:mx-auto md:max-w-7xl md:space-y-10 md:px-6 ${className}`.trim()}>
      {children}
    </div>
  );
}
