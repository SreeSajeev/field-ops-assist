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
      <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
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
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
              isActive
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.name}</span>
            {isActive && (
              <ChevronRight className="h-4 w-4 opacity-60" />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen w-64 flex-col bg-[#1E1B2E] border-r border-white/10">

      {/* =====================================================
         SAHAYA BRAND HEADER
      ====================================================== */}
      <div className="flex flex-col gap-1 border-b border-white/10 px-6 py-5">

        {/* Sahaya Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/sahaya-logo.png"
            alt="Sahaya"
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Sahaya
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-orange-400">
              Service Operations Platform
            </p>
          </div>
        </div>

        {/* Powered by Pariskq */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40">
            Powered by
          </span>
          <img
            src="/pariskq-logo.png"
            alt="Pariskq"
            className="h-4 w-auto opacity-80"
          />
        </div>
      </div>

      {/* =====================================================
         NAVIGATION
      ====================================================== */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        <NavSection title="Operations" items={navigation} />

        <div className="my-5 border-t border-white/10" />

        <NavSection title="Monitoring" items={monitoringNav} />

        {isAdmin && (
          <>
            <div className="my-5 border-t border-white/10" />
            <NavSection
              title="Administration"
              items={adminNavigation}
            />
          </>
        )}
      </nav>

      {/* =====================================================
         USER FOOTER
      ====================================================== */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-semibold text-orange-400">
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
              className="text-[10px] px-1.5 py-0 border-orange-400 text-orange-400"
            >
              {getRoleDisplay()}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm text-white/70 hover:bg-white/5 hover:text-white"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
