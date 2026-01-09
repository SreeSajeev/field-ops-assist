import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTickets } from '@/hooks/useTickets';
import { Ticket, AlertTriangle, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentTickets, isLoading: ticketsLoading } = useTickets({ status: 'all' });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your logistics operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tickets"
            value={statsLoading ? '...' : stats?.totalTickets || 0}
            icon={<Ticket className="h-5 w-5" />}
          />
          <StatCard
            title="Open Tickets"
            value={statsLoading ? '...' : stats?.openTickets || 0}
            icon={<Clock className="h-5 w-5" />}
            variant="default"
          />
          <StatCard
            title="Needs Review"
            value={statsLoading ? '...' : stats?.needsReviewCount || 0}
            icon={<AlertTriangle className="h-5 w-5" />}
            variant={stats?.needsReviewCount ? 'warning' : 'default'}
          />
          <StatCard
            title="SLA Breaches"
            value={statsLoading ? '...' : stats?.slaBreaches || 0}
            icon={<AlertCircle className="h-5 w-5" />}
            variant={stats?.slaBreaches ? 'danger' : 'success'}
          />
        </div>

        {/* Quick Actions */}
        {stats?.needsReviewCount ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Tickets require your attention</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.needsReviewCount} ticket(s) need manual review
                  </p>
                </div>
              </div>
              <Link to="/review">
                <Button>Review Now</Button>
              </Link>
            </div>
          </div>
        ) : null}

        {/* Recent Tickets */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Tickets</h2>
            <Link to="/tickets">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <TicketsTable 
            tickets={(recentTickets || []).slice(0, 10)} 
            loading={ticketsLoading} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
