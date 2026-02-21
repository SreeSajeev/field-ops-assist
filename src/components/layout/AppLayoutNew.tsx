import { ReactNode } from 'react';
import { SidebarNew } from './SidebarNew';

/**
 * New app layout matching sahaya-operations-suite structure.
 * Sidebar + main. Each page composes HeroSection, SectionWrapper, etc. with their own max-w-7xl px-6.
 * Routing, auth, and role guards are unchanged — presentation only.
 */
interface AppLayoutNewProps {
  children: ReactNode;
}

export function AppLayoutNew({ children }: AppLayoutNewProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNew />
      <main className="flex-1 overflow-y-auto scrollbar-thin bg-background">
        {children}
      </main>
    </div>
  );
}
