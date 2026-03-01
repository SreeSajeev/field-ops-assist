import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';

/**
 * Wraps Sidebar for responsive behavior. No prop changes to Sidebar.
 * <768px: fixed mobile header + overlay drawer (no layout space). Content does not shift.
 * >=768px: sidebar in flow (pixel-identical to current).
 */
export function MobileSidebarWrapper() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function showLogoFallback(e: React.SyntheticEvent<HTMLImageElement>) {
    e.currentTarget.style.display = 'none';
    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
    if (fallback) fallback.style.display = 'block';
  }
  const logoImg = (
    <img
      src="/sahaya-logo.png"
      alt="Sahaya"
      className="h-8 w-auto object-contain"
      onError={showLogoFallback}
    />
  );
  const logoFallback = (
    <span className="text-base font-bold text-foreground tracking-tight" style={{ display: 'none' }} aria-hidden>
      Sahaya
    </span>
  );

  return (
    <>
      {/* Mobile-only: fixed header. Does not occupy layout flow; main has pt-14 to clear. */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          {logoImg}
          {logoFallback}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="md:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* Desktop-only: sidebar in flow. No width/border/bg on mobile. */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Sidebar />
        </div>
      </div>

      {/* Mobile drawer overlay + panel */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            className="fixed left-0 top-0 bottom-0 z-50 flex w-56 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar md:hidden"
            role="dialog"
            aria-label="Menu"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
              <div className="flex items-center gap-2">
                {logoImg}
                {logoFallback}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Sidebar />
            </div>
          </div>
        </>
      )}
    </>
  );
}
