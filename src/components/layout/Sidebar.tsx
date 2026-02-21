import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  AlertTriangle,
  Users,
  Settings,
  LogOut,
  Truck,
  Mail,
  Clock,
  FileText,
  BarChart3,
  Shield,
  ChevronRight,
  Building2,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ======================================================
   Navigation MUST match App.tsx routes (/app/*)
====================================================== */

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'All Tickets', href: '/app/tickets', icon: Ticket },
  { name: 'Review Queue', href: '/app/review', icon: AlertTriangle, badge: true },
  { name: 'Field Executives', href: '/app/field-executives', icon: Truck },
  { name: 'Raw Emails', href: '/app/emails', icon: Mail },
];

const monitoringNav = [
  { name: 'SLA Monitor', href: '/app/sla', icon: Clock },
  { name: 'Audit Logs', href: '/app/audit', icon: FileText },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
];

const adminNavigation = [
  { name: 'Users', href: '/app/users', icon: Users },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

const superAdminNavigation = [
  { name: 'Overview', href: '/super-admin', icon: Crown },
  { name: 'Organizations', href: '/super-admin', icon: Building2 },
  { name: 'Global Users', href: '/app/users', icon: Users },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut, user, userProfile, isAdmin } = useAuth();
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';

  /* =========================
     Role Display
  ========================= */
  const getRoleDisplay = () => {
    switch (userProfile?.role) {
      case 'ADMIN':
        return 'Admin';
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'FIELD_EXECUTIVE':
        return 'Field Executive';
      default:
        return 'Service Staff';
    }
  };

  /* =========================
     Navigation Section
  ========================= */
  const NavSection = ({
    title,
    items,
  }: {
    title: string;
    items: typeof navigation;
  }) => (
    <>
      <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
        {title}
      </div>

      {items.map((item) => {
        const isActive =
          location.pathname === item.href ||
          location.pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn('nav-item group', isActive && 'active')}
          >
            <item.icon className="h-4.5 w-4.5" />
            <span className="flex-1">{item.name}</span>
            {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
          </Link>
        );
      })}
    </>
  );

  /* =========================
     Render
  ========================= */
  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl logo-bg-accent logo-glow">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-sidebar-foreground">
            Sahaya
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-sidebar-primary">
            by Pariskq
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-5">
        <NavSection title="Operations" items={navigation} />

        <div className="my-4 border-t border-sidebar-border" />

        <NavSection title="Monitoring" items={monitoringNav} />

        {isSuperAdmin && (
          <>
            <div className="my-4 border-t border-sidebar-border" />
            <NavSection title="Super Admin" items={superAdminNavigation} />
          </>
        )}

        {isAdmin && (
          <>
            <div className="my-4 border-t border-sidebar-border" />
            <NavSection title="Administration" items={adminNavigation} />
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent font-semibold text-sidebar-primary">
            {userProfile?.name?.charAt(0).toUpperCase() ||
              user?.email?.charAt(0).toUpperCase() ||
              'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {userProfile?.name || user?.email || 'User'}
            </p>
            <Badge
              variant="outline"
              className="border-sidebar-border/50 px-1.5 py-0 text-[10px] text-sidebar-primary"
            >
              {getRoleDisplay()}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
