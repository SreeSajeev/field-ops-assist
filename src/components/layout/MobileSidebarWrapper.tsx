import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';

/**
 * Wraps Sidebar for responsive behavior. No prop changes to Sidebar.
 * <768px: hamburger + slide-in drawer with overlay.
 * >=768px: sidebar in flow (pixel-identical to current).
 */
export function MobileSidebarWrapper() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <div className="flex flex-col md:w-64 md:flex-shrink-0 md:border-r md:border-sidebar-border md:bg-sidebar">
        <div className="flex md:hidden items-center justify-between h-14 px-3 border-b border-sidebar-border bg-sidebar">
          <span className="text-base font-bold text-sidebar-foreground">Sahaya</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <div className="hidden md:flex flex-1 flex-col min-h-0 overflow-hidden">
          <Sidebar />
        </div>
      </div>
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            className="fixed left-0 top-0 bottom-0 z-50 w-56 flex flex-col bg-sidebar border-r border-sidebar-border md:hidden overflow-hidden"
            role="dialog"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between h-14 px-3 border-b border-sidebar-border shrink-0">
              <span className="text-base font-bold text-sidebar-foreground">Sahaya</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <Sidebar />
            </div>
          </div>
        </>
      )}
    </>
  );
}
