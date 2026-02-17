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
  { name: 'Review Queue', href: '/app/review', icon: AlertTriangle },
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

export function Sidebar() {
  const location = useLocation();
  const { signOut, user, userProfile, isAdmin } = useAuth();

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

  return (
    <div
      className="flex h-screen w-64 flex-col"
      style={{ background: 'hsl(285 45% 18%)' }}
    >
      {/* Logo Section (UNCHANGED STYLE) */}
      <div
        className="flex h-16 items-center gap-3 border-b px-5"
        style={{ borderColor: 'hsl(285 35% 25%)' }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl logo-glow"
          style={{
            background:
              'linear-gradient(135deg, hsl(32 95% 48%), hsl(32 95% 55%))',
          }}
        >
          <Shield className="h-5 w-5 text-white" />
        </div>

        <div>
          <h1 className="text-base font-bold text-white tracking-tight">
            Sahaya
          </h1>

          <p
            className="text-[10px] font-medium uppercase tracking-wider"
            style={{ color: 'hsl(32 95% 60%)' }}
          >
            Powered by Pariskq
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-5">
        <NavSection title="Operations" items={navigation} />

        <div
          className="my-4 border-t"
          style={{ borderColor: 'hsl(285 35% 25%)' }}
        />

        <NavSection title="Monitoring" items={monitoringNav} />

        {isAdmin && (
          <>
            <div
              className="my-4 border-t"
              style={{ borderColor: 'hsl(285 35% 25%)' }}
            />
            <NavSection title="Administration" items={adminNavigation} />
          </>
        )}
      </nav>

      {/* User Section */}
      <div
        className="border-t p-4"
        style={{ borderColor: 'hsl(285 35% 25%)' }}
      >
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full font-semibold"
            style={{
              background: 'hsl(285 40% 28%)',
              color: 'hsl(32 95% 60%)',
            }}
          >
            {userProfile?.name?.charAt(0).toUpperCase() ||
              user?.email?.charAt(0).toUpperCase() ||
              'U'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {userProfile?.name || user?.email || 'User'}
            </p>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-primary/50"
              style={{ color: 'hsl(32 95% 60%)' }}
            >
              {getRoleDisplay()}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm hover:bg-[hsl(285_40%_25%)]"
          style={{ color: 'hsl(270 10% 70%)' }}
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
