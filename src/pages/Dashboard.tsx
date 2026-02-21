/*
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTickets } from '@/hooks/useTickets';
import { 
  Ticket, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  ArrowRight,
  Zap,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentTickets, isLoading: ticketsLoading } = useTickets({ status: 'all' });

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
      
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back. Here's your operations overview.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
              <span className="sla-indicator sla-safe" />
              System Healthy
            </Badge>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tickets"
            value={statsLoading ? '—' : stats?.totalTickets || 0}
            icon={<Ticket className="h-6 w-6" />}
            variant="primary"
            description="All time tickets"
          />
          <StatCard
            title="Open Tickets"
            value={statsLoading ? '—' : stats?.openTickets || 0}
            icon={<Clock className="h-6 w-6" />}
            variant="accent"
            description="Awaiting action"
          />
          <StatCard
            title="Needs Review"
            value={statsLoading ? '—' : stats?.needsReviewCount || 0}
            icon={<AlertTriangle className="h-6 w-6" />}
            variant={stats?.needsReviewCount ? 'warning' : 'default'}
            description="Manual review required"
          />
          <StatCard
            title="SLA Breaches"
            value={statsLoading ? '—' : stats?.slaBreaches || 0}
            icon={<AlertCircle className="h-6 w-6" />}
            variant={stats?.slaBreaches ? 'danger' : 'success'}
            description={stats?.slaBreaches ? 'Action required' : 'All on track'}
          />
        </div>

        {stats?.needsReviewCount ? (
          <div className="info-box info-box-warning animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {stats.needsReviewCount} ticket{stats.needsReviewCount > 1 ? 's' : ''} require your attention
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Low confidence parsing detected. Please verify ticket details.
                  </p>
                </div>
              </div>
              <Link to="/review">
                <Button className="btn-primary gap-2">
                  Review Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

     
        <div className="grid gap-6 lg:grid-cols-3">
        
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Tickets</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">Latest service requests</p>
                </div>
                <Link to="/tickets">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    View All
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <TicketsTable 
                  tickets={(recentTickets || []).slice(0, 8)} 
                  loading={ticketsLoading}
                  compact
                />
              </CardContent>
            </Card>
          </div>

        
          <div className="space-y-5">
          
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Automation Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email Processing</span>
                  <Badge className="bg-success/15 text-success border-0">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Parsing Engine</span>
                  <Badge className="bg-success/15 text-success border-0">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">WhatsApp Gateway</span>
                  <Badge className="bg-success/15 text-success border-0">Connected</Badge>
                </div>
              </CardContent>
            </Card>

           
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Ticket Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Open', count: stats?.openTickets || 0, color: 'bg-blue-500' },
                    { label: 'Assigned', count: 0, color: 'bg-purple-500' },
                    { label: 'In Progress', count: 0, color: 'bg-teal-500' },
                    { label: 'Resolved', count: 0, color: 'bg-green-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="text-sm text-muted-foreground flex-1">{item.label}</span>
                      <span className="text-sm font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  Field Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground mt-1">Active Executives</p>
                </div>
                <Link to="/field-executives">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Team
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
*/
// src/pages/Dashboard.tsx

import { Link } from 'react-router-dom';
import { AppLayoutNew } from '@/components/layout/AppLayoutNew';
import { HeroSection } from '@/components/layout/HeroSection';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { StatCard } from '@/components/dashboard/StatCard';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTickets } from '@/hooks/useTickets';
import {
  Ticket,
  AlertTriangle,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentTickets, isLoading: ticketsLoading } = useTickets({ status: 'all' });

  return (
    <AppLayoutNew>
      <HeroSection>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back. Here&apos;s your operations overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <span className="sla-indicator sla-safe" />
              System Healthy
            </Badge>
          </div>
        </div>
      </HeroSection>

      <SectionWrapper title="Service Overview" elevated>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tickets"
            value={statsLoading ? '—' : stats?.totalTickets || 0}
            icon={<Ticket className="h-6 w-6" />}
            variant="primary"
            description="All time tickets"
          />
          <StatCard
            title="Open Tickets"
            value={statsLoading ? '—' : stats?.openTickets || 0}
            icon={<Clock className="h-6 w-6" />}
            variant="accent"
            description="Awaiting action"
          />
          <StatCard
            title="Needs Review"
            value={statsLoading ? '—' : stats?.needsReviewCount || 0}
            icon={<AlertTriangle className="h-6 w-6" />}
            variant={stats?.needsReviewCount ? 'warning' : 'default'}
            description="Manual review required"
          />
          <StatCard
            title="SLA Breaches"
            value={statsLoading ? '—' : stats?.slaBreaches || 0}
            icon={<AlertCircle className="h-6 w-6" />}
            variant={stats?.slaBreaches ? 'danger' : 'success'}
            description={stats?.slaBreaches ? 'Action required' : 'All on track'}
          />
        </div>
      </SectionWrapper>

      {stats?.needsReviewCount ? (
        <SectionWrapper elevated={false}>
          <div className="info-box info-box-warning animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {stats.needsReviewCount} ticket{stats.needsReviewCount > 1 ? 's' : ''} require your attention
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Low confidence parsing detected. Please verify ticket details.
                  </p>
                </div>
              </div>
              <Link to="/app/review">
                <Button className="btn-primary gap-2">
                  Review Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </SectionWrapper>
      ) : null}

      <SectionWrapper elevated={false}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Tickets</CardTitle>
                  <p className="mt-0.5 text-sm text-muted-foreground">Latest service requests</p>
                </div>
                <Link to="/app/tickets">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    View All
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <TicketsTable
                  tickets={(recentTickets || []).slice(0, 8)}
                  loading={ticketsLoading}
                  compact
                />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Users className="h-4 w-4 text-accent" />
                  Field Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-4 text-center">
                  <p className="text-3xl font-bold text-foreground">0</p>
                  <p className="mt-1 text-sm text-muted-foreground">Active Executives</p>
                </div>
                <Link to="/app/field-executives">
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    Manage Team
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </SectionWrapper>
    </AppLayoutNew>
  );
}
