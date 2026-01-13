import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  RefreshCw, 
  TrendingUp,
  Ticket,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  MapPin,
  PieChart,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#6B21A8', '#F97316', '#0EA5E9', '#22C55E', '#EAB308', '#EF4444'];

export default function Analytics() {
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics-data'],
    queryFn: async () => {
      // Fetch tickets for various analytics
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Fetch SLA data
      const { data: slaData, error: slaError } = await supabase
        .from('sla_tracking')
        .select('*');

      if (slaError) throw slaError;

      // Fetch field executives
      const { data: fes, error: fesError } = await supabase
        .from('field_executives')
        .select('*');

      if (fesError) throw fesError;

      // Fetch assignments
      const { data: assignments, error: assignError } = await supabase
        .from('ticket_assignments')
        .select('*');

      if (assignError) throw assignError;

      // Calculate analytics
      const statusCounts: Record<string, number> = {};
      const categoryCounts: Record<string, number> = {};
      const locationCounts: Record<string, number> = {};
      const confidenceDistribution = { high: 0, medium: 0, low: 0 };
      
      let totalConfidence = 0;
      let confidenceCount = 0;

      (tickets || []).forEach(ticket => {
        // Status distribution
        statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1;

        // Category distribution
        const category = ticket.category || 'Uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        // Location distribution
        const location = ticket.location || 'Unknown';
        locationCounts[location] = (locationCounts[location] || 0) + 1;

        // Confidence distribution
        if (ticket.confidence_score !== null) {
          totalConfidence += ticket.confidence_score;
          confidenceCount++;
          if (ticket.confidence_score >= 95) confidenceDistribution.high++;
          else if (ticket.confidence_score >= 80) confidenceDistribution.medium++;
          else confidenceDistribution.low++;
        }
      });

      // SLA compliance
      const totalSLA = slaData?.length || 0;
      const breachedSLA = slaData?.filter(s => 
        s.assignment_breached || s.onsite_breached || s.resolution_breached
      ).length || 0;
      const slaCompliance = totalSLA > 0 ? Math.round(((totalSLA - breachedSLA) / totalSLA) * 100) : 100;

      // Active vs inactive FEs
      const activeFEs = fes?.filter(fe => fe.active).length || 0;
      const inactiveFEs = fes?.filter(fe => !fe.active).length || 0;

      // FE workload distribution
      const feWorkload = (fes || []).map(fe => {
        const feAssignments = (assignments || []).filter(a => a.fe_id === fe.id);
        const activeAssignments = feAssignments.filter(a => {
          const ticket = (tickets || []).find(t => t.id === a.ticket_id);
          return ticket && ticket.status !== 'RESOLVED';
        });
        return {
          name: fe.name.split(' ')[0], // First name only
          active: activeAssignments.length,
          total: feAssignments.length,
        };
      }).filter(fe => fe.total > 0);

      // Ticket volume by day (last 7 days)
      const now = new Date();
      const volumeByDay: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayTickets = (tickets || []).filter(t => 
          t.created_at?.startsWith(dateStr)
        );
        volumeByDay.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          count: dayTickets.length,
        });
      }

      return {
        totalTickets: tickets?.length || 0,
        openTickets: statusCounts['OPEN'] || 0,
        resolvedTickets: statusCounts['RESOLVED'] || 0,
        avgConfidence: confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0,
        slaCompliance,
        activeFEs,
        inactiveFEs,
        statusData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
        categoryData: Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name, value })),
        locationData: Object.entries(locationCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, value]) => ({ name, value })),
        confidenceData: [
          { name: 'High (≥95%)', value: confidenceDistribution.high, color: '#22C55E' },
          { name: 'Medium (80-94%)', value: confidenceDistribution.medium, color: '#F97316' },
          { name: 'Low (<80%)', value: confidenceDistribution.low, color: '#EF4444' },
        ],
        feWorkload,
        volumeByDay,
        needsReview: (tickets || []).filter(t => t.needs_review).length,
      };
    },
    refetchInterval: 60000,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground text-sm">
                Operational insights and performance metrics
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Ticket className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.totalTickets || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.resolvedTickets || 0}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.needsReview || 0}</p>
                  <p className="text-xs text-muted-foreground">Needs Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.avgConfidence || 0}%</p>
                  <p className="text-xs text-muted-foreground">Avg Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                  <Clock className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.slaCompliance || 100}%</p>
                  <p className="text-xs text-muted-foreground">SLA Compliance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.activeFEs || 0}</p>
                  <p className="text-xs text-muted-foreground">Active FEs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Ticket Volume Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Ticket Volume (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analyticsData?.volumeByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6B21A8" 
                      strokeWidth={2}
                      dot={{ fill: '#6B21A8', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-4 w-4" />
                Ticket Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPie>
                    <Pie
                      data={analyticsData?.statusData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(analyticsData?.statusData || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      fontSize={12}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Issues by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData?.categoryData || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      fontSize={11} 
                      width={100}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Confidence Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Parsing Confidence Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPie>
                    <Pie
                      data={analyticsData?.confidenceData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(analyticsData?.confidenceData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      fontSize={12}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Location Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Issues by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData?.locationData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      fontSize={10} 
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* FE Workload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Field Executive Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : analyticsData?.feWorkload?.length === 0 ? (
                <div className="h-[250px] flex flex-col items-center justify-center text-center">
                  <Users className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No assignment data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData?.feWorkload || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="active" name="Active" fill="#6B21A8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" name="Total" fill="#E9D5FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
