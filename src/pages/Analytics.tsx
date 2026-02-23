import { useState, useCallback, useMemo } from 'react';
import { AppLayoutNew } from '@/components/layout/AppLayoutNew';
import { PageContainer } from '@/components/layout/PageContainer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Activity,
  Download,
  Target,
  XCircle,
  Star,
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

const MS_PER_HOUR = 1000 * 60 * 60;
const HOURS_PER_DAY = 24;

function startOfDayISO(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayISO(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

function getResolutionHours(ticket: { opened_at?: string | null; updated_at?: string | null; resolved_at?: string | null; status?: string }): number | null {
  if (ticket.status !== 'RESOLVED') return null;
  const opened = ticket.opened_at ? new Date(ticket.opened_at).getTime() : null;
  const resolved = (ticket.resolved_at ? new Date(ticket.resolved_at) : ticket.updated_at ? new Date(ticket.updated_at) : null)?.getTime();
  if (opened == null || resolved == null || resolved < opened) return null;
  return (resolved - opened) / MS_PER_HOUR;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

interface AnalyticsProps {
  /** When true, render only the analytics content (no staff layout); for embedding in Client Dashboard Reports. */
  clientReportsMode?: boolean;
}

export default function Analytics({ clientReportsMode = false }: AnalyticsProps) {
  const { userProfile } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClientSlug, setSelectedClientSlug] = useState<string>('');

  const isClientRole = userProfile?.role === 'CLIENT';
  const showClientSelector =
    userProfile?.role === 'STAFF' || userProfile?.role === 'SUPER_ADMIN';

  const effectiveClientSlug = useMemo(() => {
    if (isClientRole && userProfile?.client_slug) return userProfile.client_slug;
    return selectedClientSlug || null;
  }, [isClientRole, userProfile?.client_slug, selectedClientSlug]);

  const { data: clientListData } = useQuery({
    queryKey: ['analytics-client-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('client_slug')
        .not('client_slug', 'is', null);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<{ client_slug: string | null }>;
      const slugs = [...new Set(rows.map((r) => r.client_slug).filter(Boolean) as string[])];
      return slugs.sort();
    },
    enabled: showClientSelector,
  });

  const clientOptions = clientListData ?? [];

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics-data', startDate || null, endDate || null, effectiveClientSlug],
    queryFn: async () => {
      // Type as any to avoid Supabase builder chain causing excessively deep instantiation
      let ticketsQuery: ReturnType<ReturnType<typeof supabase.from>['select']> = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (effectiveClientSlug) {
        ticketsQuery = ticketsQuery.eq('client_slug', effectiveClientSlug) as typeof ticketsQuery;
      }
      if (startDate && startDate.trim()) {
        ticketsQuery = ticketsQuery.gte('opened_at', startOfDayISO(startDate.trim())) as typeof ticketsQuery;
      }
      if (endDate && endDate.trim()) {
        ticketsQuery = ticketsQuery.lte('opened_at', endOfDayISO(endDate.trim())) as typeof ticketsQuery;
      }

      const { data: tickets, error: ticketsError } = await ticketsQuery;

      if (ticketsError) throw ticketsError;

      const { data: slaData, error: slaError } = await supabase
        .from('sla_tracking')
        .select('*');

      if (slaError) throw slaError;

      const { data: fes, error: fesError } = await supabase
        .from('field_executives')
        .select('*');

      if (fesError) throw fesError;

      const { data: assignments, error: assignError } = await supabase
        .from('ticket_assignments')
        .select('*');

      if (assignError) throw assignError;

      const ticketList = tickets || [];
      const slaList = slaData || [];
      const feList = fes || [];
      const assignmentList = assignments || [];

      const statusCounts: Record<string, number> = {};
      const categoryCounts: Record<string, number> = {};
      const locationCounts: Record<string, number> = {};
      const confidenceDistribution = { high: 0, medium: 0, low: 0 };
      let totalConfidence = 0;
      let confidenceCount = 0;

      ticketList.forEach((ticket: Record<string, unknown>) => {
        const status = ticket.status as string;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        const category = (ticket.category as string) || 'Uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        const location = (ticket.location as string) || 'Unknown';
        locationCounts[location] = (locationCounts[location] || 0) + 1;
        const score = ticket.confidence_score as number | null;
        if (score != null) {
          totalConfidence += score;
          confidenceCount++;
          if (score >= 95) confidenceDistribution.high++;
          else if (score >= 80) confidenceDistribution.medium++;
          else confidenceDistribution.low++;
        }
      });

      const totalSLA = slaList.length;
      const assignmentBreached = slaList.filter((s: Record<string, unknown>) => s.assignment_breached === true).length;
      const onsiteBreached = slaList.filter((s: Record<string, unknown>) => s.onsite_breached === true).length;
      const resolutionBreached = slaList.filter((s: Record<string, unknown>) => s.resolution_breached === true).length;
      const assignmentCompliance = totalSLA > 0 ? Math.round(((totalSLA - assignmentBreached) / totalSLA) * 100) : 100;
      const onsiteCompliance = totalSLA > 0 ? Math.round(((totalSLA - onsiteBreached) / totalSLA) * 100) : 100;
      const resolutionCompliance = totalSLA > 0 ? Math.round(((totalSLA - resolutionBreached) / totalSLA) * 100) : 100;
      const breachedSLA = slaList.filter(
        (s: Record<string, unknown>) => s.assignment_breached || s.onsite_breached || s.resolution_breached
      ).length;
      const breachedTicketIds = new Set(
        slaList
          .filter((s: Record<string, unknown>) => s.assignment_breached || s.onsite_breached || s.resolution_breached)
          .map((s: Record<string, unknown>) => s.ticket_id as string)
      );
      const totalBreachedTickets = breachedTicketIds.size;

      const assignmentById = new Map(assignmentList.map((a: Record<string, unknown>) => [a.id as string, a]));
      const ticketIdToFeId = new Map<string, string>();
      ticketList.forEach((t: Record<string, unknown>) => {
        const aid = t.current_assignment_id as string | null;
        if (aid) {
          const a = assignmentById.get(aid);
          if (a?.fe_id) ticketIdToFeId.set(t.id as string, a.fe_id as string);
        }
        if (!ticketIdToFeId.has(t.id as string)) {
          const ticketAssignments = assignmentList.filter((a: Record<string, unknown>) => a.ticket_id === t.id);
          const latest = ticketAssignments.sort(
            (a, b) => new Date((b.assigned_at as string) || 0).getTime() - new Date((a.assigned_at as string) || 0).getTime()
          )[0];
          if (latest?.fe_id) ticketIdToFeId.set(t.id as string, latest.fe_id as string);
        }
      });
      const breachCountByFeId: Record<string, number> = {};
      slaList.forEach((s: Record<string, unknown>) => {
        if (!s.assignment_breached && !s.onsite_breached && !s.resolution_breached) return;
        const feId = ticketIdToFeId.get(s.ticket_id as string);
        if (feId) breachCountByFeId[feId] = (breachCountByFeId[feId] || 0) + 1;
      });
      const feWithMostBreaches = feList.length > 0 && Object.keys(breachCountByFeId).length > 0
        ? feList.reduce((best, fe) => {
            const count = breachCountByFeId[fe.id] || 0;
            return count > (breachCountByFeId[best.id] || 0) ? fe : best;
          }, feList[0])
        : null;
      const feMostBreachesName = feWithMostBreaches ? (feWithMostBreaches as Record<string, unknown>).name as string : '—';
      const feMostBreachesCount = feWithMostBreaches ? breachCountByFeId[(feWithMostBreaches as Record<string, unknown>).id as string] || 0 : 0;

      const resolutionHoursList = ticketList
        .map((t: Record<string, unknown>) => getResolutionHours(t as Parameters<typeof getResolutionHours>[0]))
        .filter((h): h is number => h != null);
      const avgResolutionHours = resolutionHoursList.length > 0
        ? resolutionHoursList.reduce((s, h) => s + h, 0) / resolutionHoursList.length
        : 0;
      const medianResolutionHours = median(resolutionHoursList);
      const fastestResolutionHours = resolutionHoursList.length > 0 ? Math.min(...resolutionHoursList) : 0;
      const slowestResolutionHours = resolutionHoursList.length > 0 ? Math.max(...resolutionHoursList) : 0;
      const resolvedWithin24h = resolutionHoursList.filter((h) => h <= HOURS_PER_DAY).length;
      const resolvedWithin24hPct = resolutionHoursList.length > 0
        ? Math.round((resolvedWithin24h / resolutionHoursList.length) * 100)
        : 0;

      const priorityTickets = ticketList.filter((t: Record<string, unknown>) => t.priority === true);
      const priorityPct = ticketList.length > 0 ? Math.round((priorityTickets.length / ticketList.length) * 100) : 0;
      const priorityResolvedHours = priorityTickets
        .map((t: Record<string, unknown>) => getResolutionHours(t as Parameters<typeof getResolutionHours>[0]))
        .filter((h): h is number => h != null);
      const normalResolvedHours = ticketList
        .filter((t: Record<string, unknown>) => t.priority !== true)
        .map((t: Record<string, unknown>) => getResolutionHours(t as Parameters<typeof getResolutionHours>[0]))
        .filter((h): h is number => h != null);
      const avgResolutionPriority = priorityResolvedHours.length > 0
        ? priorityResolvedHours.reduce((s, h) => s + h, 0) / priorityResolvedHours.length
        : 0;
      const avgResolutionNormal = normalResolvedHours.length > 0
        ? normalResolvedHours.reduce((s, h) => s + h, 0) / normalResolvedHours.length
        : 0;
      const priorityTicketIds = new Set(priorityTickets.map((t: Record<string, unknown>) => t.id as string));
      let prioritySlaTotal = 0;
      let prioritySlaBreached = 0;
      let normalSlaTotal = 0;
      let normalSlaBreached = 0;
      slaList.forEach((s: Record<string, unknown>) => {
        const breached = !!(s.assignment_breached || s.onsite_breached || s.resolution_breached);
        if (priorityTicketIds.has(s.ticket_id as string)) {
          prioritySlaTotal++;
          if (breached) prioritySlaBreached++;
        } else {
          normalSlaTotal++;
          if (breached) normalSlaBreached++;
        }
      });
      const slaCompliancePriority = prioritySlaTotal > 0 ? Math.round(((prioritySlaTotal - prioritySlaBreached) / prioritySlaTotal) * 100) : 100;
      const slaComplianceNormal = normalSlaTotal > 0 ? Math.round(((normalSlaTotal - normalSlaBreached) / normalSlaTotal) * 100) : 100;

      const slaCompliance = totalSLA > 0 ? Math.round(((totalSLA - breachedSLA) / totalSLA) * 100) : 100;
      const activeFEs = feList.filter((fe: Record<string, unknown>) => fe.active).length;
      const inactiveFEs = feList.filter((fe: Record<string, unknown>) => !fe.active).length;

      const feWorkload = feList.map((fe: Record<string, unknown>) => {
        const feAssignments = assignmentList.filter((a: Record<string, unknown>) => a.fe_id === fe.id);
        const activeAssignments = feAssignments.filter((a: Record<string, unknown>) => {
          const t = ticketList.find((ticket: Record<string, unknown>) => ticket.id === a.ticket_id);
          return t && (t.status as string) !== 'RESOLVED';
        });
        return {
          name: (fe.name as string).split(' ')[0],
          active: activeAssignments.length,
          total: feAssignments.length,
        };
      }).filter((fe: { total: number }) => fe.total > 0);

      const now = new Date();
      const volumeByDay: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayTickets = ticketList.filter((t: Record<string, unknown>) =>
          String((t.created_at as string) || '').startsWith(dateStr)
        );
        volumeByDay.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          count: dayTickets.length,
        });
      }

      return {
        tickets: ticketList,
        totalTickets: ticketList.length,
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
        needsReview: ticketList.filter((t: Record<string, unknown>) => t.needs_review).length,
        assignmentSlaCompliance: assignmentCompliance,
        onsiteSlaCompliance: onsiteCompliance,
        resolutionSlaCompliance: resolutionCompliance,
        totalBreachedTickets,
        feWithMostBreachesName: feMostBreachesName,
        feMostBreachesCount,
        avgResolutionHours,
        medianResolutionHours,
        fastestResolutionHours,
        slowestResolutionHours,
        resolvedWithin24hPct,
        avgResolutionHoursOverall: resolutionHoursList.length > 0 ? avgResolutionHours : null,
        priorityPct,
        avgResolutionPriority,
        avgResolutionNormal,
        slaCompliancePriority: slaCompliancePriority,
        slaComplianceNormal: slaComplianceNormal,
      };
    },
    refetchInterval: 60000,
  });

  const handleExportTickets = useCallback(() => {
    const tickets = analyticsData?.tickets as Record<string, unknown>[] | undefined;
    if (!tickets || tickets.length === 0) return;
    const headers = ['ticket_number', 'status', 'complaint_id', 'vehicle_number', 'category', 'issue_type', 'location', 'opened_at', 'created_at', 'priority', 'confidence_score', 'needs_review', 'client_slug'];
    const headerDisplay = headers.map((h) => (h === 'client_slug' ? 'Client' : h));
    const rows = tickets.map((t) => headers.map((h) => (t[h] != null ? String(t[h]) : '')).join(','));
    const csv = [headerDisplay.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyticsData?.tickets]);

  const handleExportMetrics = useCallback(() => {
    const d = analyticsData;
    if (!d) return;
    const escape = (v: string) => (v.includes(',') || v.includes('"') || v.includes('\n') ? `"${String(v).replace(/"/g, '""')}"` : v);
    const sections: string[] = [];

    // 1) Summary metrics (existing)
    const summaryRows = [
      ['Metric', 'Value'],
      ['Total Tickets', String(d.totalTickets)],
      ['Resolved Tickets', String(d.resolvedTickets)],
      ['Needs Review', String(d.needsReview)],
      ['SLA Compliance %', `${d.slaCompliance}%`],
      ['Assignment SLA Compliance %', `${d.assignmentSlaCompliance}%`],
      ['Onsite SLA Compliance %', `${d.onsiteSlaCompliance}%`],
      ['Resolution SLA Compliance %', `${d.resolutionSlaCompliance}%`],
      ['Total Breached Tickets', String(d.totalBreachedTickets)],
      ['FE With Most Breaches', `${d.feWithMostBreachesName} (${d.feMostBreachesCount})`],
      ['Avg Resolution (hours)', String(d.avgResolutionHours?.toFixed(2) ?? '—')],
      ['Median Resolution (hours)', String(d.medianResolutionHours?.toFixed(2) ?? '—')],
      ['Fastest Resolution (hours)', String(d.fastestResolutionHours?.toFixed(2) ?? '—')],
      ['Slowest Resolution (hours)', String(d.slowestResolutionHours?.toFixed(2) ?? '—')],
      ['Resolved Within 24h %', `${d.resolvedWithin24hPct}%`],
      ['Priority Tickets %', `${d.priorityPct}%`],
      ['Avg Resolution Priority (hours)', String(d.avgResolutionPriority?.toFixed(2) ?? '—')],
      ['Avg Resolution Normal (hours)', String(d.avgResolutionNormal?.toFixed(2) ?? '—')],
      ['SLA Compliance (Priority)', `${d.slaCompliancePriority}%`],
      ['SLA Compliance (Normal)', `${d.slaComplianceNormal}%`],
    ];
    sections.push(summaryRows.map((r) => r.map(escape).join(',')).join('\n'));

    // 2) Chart data: Status Distribution
    const statusData = (d.statusData as { name: string; value: number }[]) ?? [];
    if (statusData.length > 0) {
      sections.push('\nStatus Distribution\nStatus,Count\n' + statusData.map((r) => `${escape(r.name)},${r.value}`).join('\n'));
    }

    // 3) Chart data: Category (Top 6)
    const categoryData = (d.categoryData as { name: string; value: number }[]) ?? [];
    if (categoryData.length > 0) {
      sections.push('\nCategory (Top 6)\nCategory,Count\n' + categoryData.map((r) => `${escape(r.name)},${r.value}`).join('\n'));
    }

    // 4) Chart data: Location (Top 8)
    const locationData = (d.locationData as { name: string; value: number }[]) ?? [];
    if (locationData.length > 0) {
      sections.push('\nLocation (Top 8)\nLocation,Count\n' + locationData.map((r) => `${escape(r.name)},${r.value}`).join('\n'));
    }

    // 5) Chart data: Volume by Day (Last 7 Days)
    const volumeByDay = (d.volumeByDay as { date: string; count: number }[]) ?? [];
    if (volumeByDay.length > 0) {
      sections.push('\nVolume by Day (Last 7 Days)\nDate,Count\n' + volumeByDay.map((r) => `${escape(r.date)},${r.count}`).join('\n'));
    }

    // 6) Chart data: Confidence Distribution
    const confidenceData = (d.confidenceData as { name: string; value: number }[]) ?? [];
    if (confidenceData.length > 0) {
      sections.push('\nConfidence Distribution\nLevel,Count\n' + confidenceData.map((r) => `${escape(r.name)},${r.value}`).join('\n'));
    }

    // 7) Chart data: FE Workload
    const feWorkload = (d.feWorkload as { name: string; active: number; total: number }[]) ?? [];
    if (feWorkload.length > 0) {
      sections.push('\nField Executive Workload\nFE Name,Active,Total\n' + feWorkload.map((r) => `${escape(r.name)},${r.active},${r.total}`).join('\n'));
    }

    const csv = sections.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyticsData]);

  const content = (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-6 lg:gap-8 items-stretch">
        {/* LEFT COLUMN: KPIs, Filters, Summary */}
        <aside className="space-y-6 order-1 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground text-sm">Operational insights and performance metrics</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Date range &amp; actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showClientSelector && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Client</Label>
                  <Select
                    value={selectedClientSlug || 'all'}
                    onValueChange={(v) => setSelectedClientSlug(v === 'all' ? '' : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clientOptions.map((slug) => (
                        <SelectItem key={slug} value={slug}>
                          {slug}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-xs text-muted-foreground">From</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-xs text-muted-foreground">To</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="w-full justify-center">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportTickets} disabled={!analyticsData?.tickets?.length} className="w-full justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Tickets
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportMetrics} disabled={!analyticsData} className="w-full justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Metrics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SLA Deep Metrics */}
          <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.assignmentSlaCompliance ?? 100}%</p>
                  <p className="text-xs text-muted-foreground">Assignment SLA</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.onsiteSlaCompliance ?? 100}%</p>
                  <p className="text-xs text-muted-foreground">Onsite SLA</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.resolutionSlaCompliance ?? 100}%</p>
                  <p className="text-xs text-muted-foreground">Resolution SLA</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.totalBreachedTickets ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Breached Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold truncate" title={analyticsData?.feWithMostBreachesName ?? '—'}>{analyticsData?.feWithMostBreachesName ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">FE Most Breaches ({analyticsData?.feMostBreachesCount ?? 0})</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData?.avgResolutionHours != null ? analyticsData.avgResolutionHours.toFixed(1) : '—'}</p>
                  <p className="text-xs text-muted-foreground">Avg Resolution (h)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Resolution & Priority */}
          <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xl font-bold">{analyticsData?.avgResolutionHours != null ? analyticsData.avgResolutionHours.toFixed(1) : '—'}h</p>
              <p className="text-xs text-muted-foreground">Avg Resolution</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xl font-bold">{analyticsData?.medianResolutionHours != null ? analyticsData.medianResolutionHours.toFixed(1) : '—'}h</p>
              <p className="text-xs text-muted-foreground">Median Resolution</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xl font-bold">{analyticsData?.fastestResolutionHours != null ? analyticsData.fastestResolutionHours.toFixed(1) : '—'}h</p>
              <p className="text-xs text-muted-foreground">Fastest</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xl font-bold">{analyticsData?.slowestResolutionHours != null ? analyticsData.slowestResolutionHours.toFixed(1) : '—'}h</p>
              <p className="text-xs text-muted-foreground">Slowest</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xl font-bold">{analyticsData?.resolvedWithin24hPct ?? 0}%</p>
              <p className="text-xs text-muted-foreground">Resolved &lt;24h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xl font-bold">{analyticsData?.priorityPct ?? 0}%</p>
              <p className="text-xs text-muted-foreground">Priority Tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xl font-bold">{analyticsData?.avgResolutionPriority != null ? analyticsData.avgResolutionPriority.toFixed(1) : '—'}h</p>
              <p className="text-xs text-muted-foreground">Avg Res (Priority)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xl font-bold">{analyticsData?.avgResolutionNormal != null ? analyticsData.avgResolutionNormal.toFixed(1) : '—'}h</p>
              <p className="text-xs text-muted-foreground">Avg Res (Normal)</p>
            </CardContent>
          </Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Star className="h-8 w-8 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl font-bold">{analyticsData?.slaCompliancePriority ?? 100}%</p>
                  <p className="text-xs text-muted-foreground">SLA Compliance (Priority)</p>
                </div>
              </div>
            </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl font-bold">{analyticsData?.slaComplianceNormal ?? 100}%</p>
                    <p className="text-xs text-muted-foreground">SLA Compliance (Normal)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Ticket className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{analyticsData?.totalTickets ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{analyticsData?.resolvedTickets ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{analyticsData?.needsReview ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Needs Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{analyticsData?.avgConfidence ?? 0}%</p>
                  <p className="text-xs text-muted-foreground">Avg Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{analyticsData?.slaCompliance ?? 100}%</p>
                  <p className="text-xs text-muted-foreground">SLA Compliance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{analyticsData?.activeFEs ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Active FEs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </aside>

        {/* RIGHT COLUMN: All charts - fills height to avoid negative space */}
        <div className="order-2 min-w-0 flex flex-col min-h-0 flex-1">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0 grid-auto-rows: minmax(280px, 1fr)">
          <Card className="flex flex-col h-full min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Ticket Volume (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
              {isLoading ? (
                <div className="flex-1 min-h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.volumeByDay ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#6B21A8" strokeWidth={2} dot={{ fill: '#6B21A8', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col h-full min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-4 w-4" />
                Ticket Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
              {isLoading ? (
                <div className="flex-1 min-h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={analyticsData?.statusData ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(analyticsData?.statusData ?? []).map((_: { name: string; value: number }, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" fontSize={12} />
                  </RechartsPie>
                </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col h-full min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Issues by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
              {isLoading ? (
                <div className="flex-1 min-h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.categoryData ?? []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={100} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col h-full min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Parsing Confidence Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
              {isLoading ? (
                <div className="flex-1 min-h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={analyticsData?.confidenceData ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(analyticsData?.confidenceData ?? []).map((entry: { color: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" fontSize={12} />
                  </RechartsPie>
                </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col h-full min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Issues by Location
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
              {isLoading ? (
                <div className="flex-1 min-h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.locationData ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} angle={-45} textAnchor="end" height={60} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col h-full min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Field Executive Workload
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
              {isLoading ? (
                <div className="flex-1 min-h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (analyticsData?.feWorkload?.length ?? 0) === 0 ? (
                <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center text-center">
                  <Users className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No assignment data available</p>
                </div>
              ) : (
                <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.feWorkload ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="active" name="Active" fill="#6B21A8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" name="Total" fill="#E9D5FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
  );

  if (clientReportsMode) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-6" style={{ minHeight: '100%' }}>
        {content}
      </div>
    );
  }

  return (
    <AppLayoutNew>
      <PageContainer>
        {content}
      </PageContainer>
    </AppLayoutNew>
  );
}
