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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'All Tickets', href: '/tickets', icon: Ticket },
  { name: 'Review Queue', href: '/review', icon: AlertTriangle, badge: true },
  { name: 'Field Executives', href: '/field-executives', icon: Truck },
  { name: 'Raw Emails', href: '/emails', icon: Mail },
];

const monitoringNav = [
  { name: 'SLA Monitor', href: '/sla', icon: Clock },
  { name: 'Audit Logs', href: '/audit', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const NavSection = ({ 
    title, 
    items 
  }: { 
    title: string; 
    items: typeof navigation 
  }) => (
    <>
      <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
        {title}
      </div>
      {items.map((item) => {
        const isActive = location.pathname === item.href || 
          (item.href !== '/' && location.pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn('nav-item group', isActive && 'active')}
          >
            <item.icon className="h-4.5 w-4.5" />
            <span className="flex-1">{item.name}</span>
            {isActive && (
              <ChevronRight className="h-4 w-4 opacity-70" />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen w-64 flex-col" style={{ background: 'hsl(285 45% 18%)' }}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-5" style={{ borderColor: 'hsl(285 35% 25%)' }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl logo-glow" 
             style={{ background: 'linear-gradient(135deg, hsl(32 95% 48%), hsl(32 95% 55%))' }}>
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">LogiCRM</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'hsl(32 95% 60%)' }}>by Pariskq</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-5">
        <NavSection title="Operations" items={navigation} />
        
        <div className="my-4 border-t" style={{ borderColor: 'hsl(285 35% 25%)' }} />
        
        <NavSection title="Monitoring" items={monitoringNav} />
        
        <div className="my-4 border-t" style={{ borderColor: 'hsl(285 35% 25%)' }} />
        
        <NavSection title="Administration" items={adminNavigation} />
      </nav>

      {/* User section */}
      <div className="border-t p-4" style={{ borderColor: 'hsl(285 35% 25%)' }}>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full font-semibold"
               style={{ background: 'hsl(285 40% 28%)', color: 'hsl(32 95% 60%)' }}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user?.email || 'User'}
            </p>
            <p className="text-xs" style={{ color: 'hsl(270 10% 60%)' }}>Service Staff</p>
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
