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
  Sliders,
  ListOrdered,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';
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

/* Tenant Admin (ADMIN role) only: Dashboard, Users, FEs, Service Managers, Ticket Settings, Settings */
const tenantAdminNav = [
  { name: 'Dashboard', href: '/app/tenant-admin', icon: LayoutDashboard },
  { name: 'Users', href: '/app/users', icon: Users },
  { name: 'Field Executives', href: '/app/field-executives', icon: Truck },
  { name: 'Service Managers', href: '/app/service-managers', icon: Shield },
  { name: 'Ticket Settings', href: '/app/ticket-settings', icon: Sliders },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

/* Legacy: full configuration nav (used for non-ADMIN staff with config) */
const configurationNav = [
  { name: 'Users', href: '/app/users', icon: Users },
  { name: 'Ticket Settings', href: '/app/ticket-settings', icon: Sliders },
  { name: 'SLA Settings', href: '/app/ticket-settings', icon: Clock },
  { name: 'Categories & Issue Types', href: '/app/ticket-settings', icon: ListOrdered },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

/* Super Admin only: grouped sections for SaaS control panel */
const platformNav = [
  { name: 'Platform Overview', href: '/app/platform', icon: LayoutDashboard },
  { name: 'Organisations', href: '/app/organisations', icon: Building2 },
];

const operationsNav = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'All Tickets', href: '/app/tickets', icon: Ticket },
  { name: 'Review Queue', href: '/app/review', icon: AlertTriangle, badge: true },
  { name: 'Field Executives', href: '/app/field-executives', icon: Truck },
  { name: 'Service Managers', href: '/app/service-managers', icon: Shield },
  { name: 'Raw Emails', href: '/app/emails', icon: Mail },
];

const monitoringNavOrdered = [
  { name: 'SLA Monitor', href: '/app/sla', icon: Clock },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Audit Logs', href: '/app/audit', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut, user, userProfile, isAdmin } = useAuth();
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';
  const isTenantAdmin = isAdmin && !isSuperAdmin;

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
      case 'CLIENT':
        return 'Client';
      case 'STAFF':
        return 'Service Manager';
      default:
        return 'Service Manager';
    }
  };

  /* =========================
     Navigation Section
  ========================= */
  const sectionLabelClass = 'mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground';

  const NavSection = ({
    title,
    items,
    hideTitle,
  }: {
    title: string;
    items: typeof navigation;
    hideTitle?: boolean;
  }) => (
    <>
      {!hideTitle && (
        <div className={isSuperAdmin ? sectionLabelClass : 'mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40'}>
          {title}
        </div>
      )}

      {items.map((item) => {
        const isActive = location.pathname === item.href;

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
      {/* Logo + Branding */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <img src="/sahaya-logo.png" alt={APP_NAME} className="h-8 w-auto flex-shrink-0" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-sidebar-foreground">{APP_NAME}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-primary/70">BY PARISKQ</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-5">
        {isSuperAdmin ? (
          <>
            <div className={sectionLabelClass}>Platform</div>
            <NavSection title="" items={platformNav} hideTitle />

            <div className="mt-6 mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Operations</div>
            <NavSection title="" items={operationsNav} hideTitle />

            <div className="mt-6 mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Monitoring</div>
            <NavSection title="" items={monitoringNavOrdered} hideTitle />

            <div className="mt-6 mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Administration</div>
            <NavSection title="" items={adminNavigation} hideTitle />
          </>
        ) : isTenantAdmin ? (
          /* ADMIN only: Dashboard, Users, Field Executives, Ticket Settings, Settings — no clutter */
          <NavSection title="" items={tenantAdminNav} hideTitle />
        ) : (
          <>
            <NavSection title="Operations" items={navigation} />

            <div className="my-4 border-t border-sidebar-border" />

            <NavSection title="Monitoring" items={monitoringNav} />

            {isAdmin && !isTenantAdmin && (
              <>
                <div className="my-4 border-t border-sidebar-border" />
                <NavSection title="Administration" items={adminNavigation} />
              </>
            )}
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
