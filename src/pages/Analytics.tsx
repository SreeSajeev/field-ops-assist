import { useState, useCallback, useMemo } from 'react';
import { subDays } from 'date-fns';
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
import { formatIST, getStartOfDayIST, getEndOfDayIST, todayIST } from '@/lib/dateUtils';

const COLORS = ['#6B21A8', '#F97316', '#0EA5E9', '#22C55E', '#EAB308', '#EF4444'];

const MS_PER_HOUR = 1000 * 60 * 60;
const HOURS_PER_DAY = 24;

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

  const organisationIdForList = userProfile?.organisation_id ?? null;
  const isSuperAdminForList = userProfile?.role === 'SUPER_ADMIN';

  const { data: clientListData } = useQuery({
    queryKey: ['analytics-client-list', organisationIdForList, isSuperAdminForList],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('tickets')
        .select('client_slug')
        .not('client_slug', 'is', null);
      if (!isSuperAdminForList && organisationIdForList) {
        query = query.eq('organisation_id', organisationIdForList);
      }
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<{ client_slug: string | null }>;
      const slugs = [...new Set(rows.map((r) => r.client_slug).filter(Boolean) as string[])];
      return slugs.sort();
    },
    enabled: showClientSelector,
  });

  const clientOptions = clientListData ?? [];

  const organisationId = userProfile?.organisation_id ?? null;
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics-data', startDate || null, endDate || null, effectiveClientSlug, organisationId, isSuperAdmin],
    queryFn: async () => {
      // Type as any to avoid Supabase builder chain causing excessively deep instantiation
      let ticketsQuery: ReturnType<ReturnType<typeof supabase.from>['select']> = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isSuperAdmin && organisationId) {
        ticketsQuery = ticketsQuery.eq('organisation_id', organisationId) as typeof ticketsQuery;
      }
      if (effectiveClientSlug) {
        ticketsQuery = ticketsQuery.eq('client_slug', effectiveClientSlug) as typeof ticketsQuery;
      }
      if (startDate && startDate.trim()) {
        ticketsQuery = ticketsQuery.gte('opened_at', getStartOfDayIST(startDate.trim()).toISOString()) as typeof ticketsQuery;
      }
      if (endDate && endDate.trim()) {
        ticketsQuery = ticketsQuery.lte('opened_at', getEndOfDayIST(endDate.trim()).toISOString()) as typeof ticketsQuery;
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

      /* Multi-attempt FE resolution metrics */
      const totalAttempts = assignmentList.length;
      const failedOutcomes = (assignmentList as Record<string, unknown>[]).filter((a) => a.outcome === 'FAILED').length;
      const successOutcomes = (assignmentList as Record<string, unknown>[]).filter((a) => a.outcome === 'SUCCESS').length;
      const attemptsPerTicket = new Map<string, number>();
      (assignmentList as Record<string, unknown>[]).forEach((a) => {
        const tid = a.ticket_id as string;
        attemptsPerTicket.set(tid, (attemptsPerTicket.get(tid) || 0) + 1);
      });
      const resolvedTicketIds = new Set(
        ticketList
          .filter((t: Record<string, unknown>) => t.status === 'RESOLVED')
          .map((t: Record<string, unknown>) => t.id as string)
      );
      const resolvedAttemptCounts: number[] = [...resolvedTicketIds]
        .map((id: string) => attemptsPerTicket.get(id) || 0)
        .filter((n): n is number => n > 0);
      const avgAttemptsBeforeResolution =
        resolvedAttemptCounts.length > 0
          ? resolvedAttemptCounts.reduce((s: number, n: number) => s + n, 0) / resolvedAttemptCounts.length
          : null;
      const failureRatePct =
        totalAttempts > 0 ? Math.round((failedOutcomes / totalAttempts) * 100) : 0;
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
      const todayStr = formatIST(now, 'yyyy-MM-dd');
      const volumeByDay: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStartIST = getStartOfDayIST(todayStr);
        const dayStartMs = dayStartIST.getTime() - i * 24 * 60 * 60 * 1000;
        const dayStartDate = new Date(dayStartMs);
        const dateStr = formatIST(dayStartDate, 'yyyy-MM-dd');
        const dayEndDate = getEndOfDayIST(dateStr);
        const dayTickets = ticketList.filter((t: Record<string, unknown>) => {
          const created = (t.created_at as string) || '';
          if (!created) return false;
          const createdTime = new Date(created).getTime();
          return createdTime >= dayStartDate.getTime() && createdTime <= dayEndDate.getTime();
        });
        volumeByDay.push({
          date: formatIST(dayStartDate, 'EEE MM/dd'),
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
        totalAttempts,
        failedAttempts: failedOutcomes,
        successAttempts: successOutcomes,
        avgAttemptsBeforeResolution: avgAttemptsBeforeResolution != null ? Math.round(avgAttemptsBeforeResolution * 100) / 100 : null,
        failureRatePct,
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
    a.download = `analytics-tickets-${todayIST()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyticsData?.tickets]);

  const setDateRange = useCallback((days: number | null) => {
    if (days === null) {
      setStartDate('');
      setEndDate('');
      return;
    }
    const today = getStartOfDayIST(todayIST());
    const start = subDays(today, days - 1);
    setStartDate(formatIST(start, 'yyyy-MM-dd'));
    setEndDate(formatIST(today, 'yyyy-MM-dd'));
  }, []);

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
      ['Total FE Attempts', String(d.totalAttempts ?? '—')],
      ['Failed Attempts', String(d.failedAttempts ?? '—')],
      ['Success Attempts', String(d.successAttempts ?? '—')],
      ['Avg Attempts Before Resolution', String(d.avgAttemptsBeforeResolution != null ? d.avgAttemptsBeforeResolution : '—')],
      ['Failure Rate %', `${d.failureRatePct ?? 0}%`],
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
    a.download = `analytics-metrics-${todayIST()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyticsData]);

  /* Derived series for charts (from existing data, no new fetch) */
  const resolutionTimeByDay = useMemo(() => {
    const tickets = (analyticsData?.tickets ?? []) as Array<Record<string, unknown> & { status?: string; opened_at?: string | null; updated_at?: string | null; resolved_at?: string | null }>;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED');
    const todayStr = formatIST(new Date(), 'yyyy-MM-dd');
    const out: { date: string; avgHours: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStartIST = getStartOfDayIST(todayStr);
      const dayStartMs = dayStartIST.getTime() - i * 24 * 60 * 60 * 1000;
      const dayStartDate = new Date(dayStartMs);
      const dateStr = formatIST(dayStartDate, 'yyyy-MM-dd');
      const dayEndDate = getEndOfDayIST(dateStr);
      const dayResolved = resolved.filter((t) => {
        const resolvedAt = (t.resolved_at ?? t.updated_at) as string | undefined;
        if (!resolvedAt) return false;
        const tms = new Date(resolvedAt).getTime();
        return tms >= dayStartDate.getTime() && tms <= dayEndDate.getTime();
      });
      const hours = dayResolved
        .map((t) => getResolutionHours(t))
        .filter((h): h is number => h != null);
      const avgHours = hours.length > 0 ? hours.reduce((a, b) => a + b, 0) / hours.length : 0;
      out.push({
        date: formatIST(dayStartDate, 'EEE MM/dd'),
        avgHours: Math.round(avgHours * 10) / 10,
        count: dayResolved.length,
      });
    }
    return out;
  }, [analyticsData?.tickets]);

  const slaByPhaseData = useMemo(() => {
    const d = analyticsData;
    if (!d) return [];
    return [
      { name: 'Assignment', value: d.assignmentSlaCompliance ?? 100, fill: '#0EA5E9' },
      { name: 'Onsite', value: d.onsiteSlaCompliance ?? 100, fill: '#22C55E' },
      { name: 'Resolution', value: d.resolutionSlaCompliance ?? 100, fill: '#6B21A8' },
    ];
  }, [analyticsData]);

  const priorityData = useMemo(() => {
    const tickets = (analyticsData?.tickets ?? []) as Array<Record<string, unknown>>;
    const priority = tickets.filter((t) => t.priority === true).length;
    const normal = tickets.length - priority;
    return [
      { name: 'Priority', value: priority, fill: '#F97316' },
      { name: 'Normal', value: normal, fill: '#94A3B8' },
    ].filter((d) => d.value > 0);
  }, [analyticsData?.tickets]);

  const content = (
    <div className="space-y-8">
      {/* Page header with export actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-sm">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold break-words">Analytics</h1>
            <p className="text-muted-foreground text-sm">Executive overview and key metrics</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportTickets} disabled={!analyticsData?.tickets?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export Tickets
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportMetrics} disabled={!analyticsData}>
            <Download className="h-4 w-4 mr-2" />
            Export Metrics
          </Button>
        </div>
      </div>

      {/* SECTION 1 — Full-width filter bar */}
      <Card className="shadow-sm border-border/60 w-full">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <span className="text-xs text-muted-foreground font-medium">Quick range:</span>
            <Button variant="outline" size="sm" onClick={() => setDateRange(7)} className="shrink-0">
              Last 7 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDateRange(30)} className="shrink-0">
              Last 30 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDateRange(90)} className="shrink-0">
              Last 90 days
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDateRange(null)} className="shrink-0">
              Clear range
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            {showClientSelector && (
              <div className="min-w-[140px] w-full sm:w-auto sm:min-w-[160px] lg:max-w-[200px]">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Client</Label>
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
                      <SelectItem key={slug} value={slug}>{slug}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="min-w-[140px] w-full sm:w-auto lg:max-w-[160px]">
              <Label htmlFor="startDate" className="text-xs text-muted-foreground mb-1.5 block">From</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="min-w-[140px] w-full sm:w-auto lg:max-w-[160px]">
              <Label htmlFor="endDate" className="text-xs text-muted-foreground mb-1.5 block">To</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" size="default" onClick={() => refetch()} disabled={isLoading} className="shrink-0">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 — KPI summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card className="w-full shadow-sm border-border/60">
          <CardContent className="p-4 md:p-6">
            <p className="text-2xl lg:text-3xl font-bold break-words">{analyticsData?.totalTickets ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Tickets</p>
          </CardContent>
        </Card>
        <Card className="w-full shadow-sm border-border/60">
          <CardContent className="p-4 md:p-6">
            <p className="text-2xl lg:text-3xl font-bold break-words">{analyticsData?.openTickets ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Open Tickets</p>
          </CardContent>
        </Card>
        <Card className="w-full shadow-sm border-border/60">
          <CardContent className="p-4 md:p-6">
            <p className="text-2xl lg:text-3xl font-bold break-words">{analyticsData?.resolvedTickets ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Resolved Tickets</p>
          </CardContent>
        </Card>
        <Card className="w-full shadow-sm border-border/60">
          <CardContent className="p-4 md:p-6">
            <p className="text-2xl lg:text-3xl font-bold break-words">{analyticsData?.slaCompliance ?? 100}%</p>
            <p className="text-xs text-muted-foreground mt-1">SLA Compliance</p>
          </CardContent>
        </Card>
        <Card className="w-full shadow-sm border-border/60">
          <CardContent className="p-4 md:p-6">
            <p className="text-2xl lg:text-3xl font-bold break-words">
              {analyticsData?.avgResolutionHours != null ? analyticsData.avgResolutionHours.toFixed(1) : '—'}h
            </p>
            <p className="text-xs text-muted-foreground mt-1">Avg Resolution Time</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3 — Graphs: 5–6 executive charts, 2 per row, gap-8 */}
      {/* Row 1: Ticket Volume (largest) + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="flex w-full flex-col shadow-sm border-border/60 min-h-[340px] overflow-hidden">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-base flex items-center gap-2 break-words min-w-0">
              <Activity className="h-4 w-4 shrink-0" />
              Ticket Volume (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-4 pt-0 pb-4 md:px-6 md:pb-6 min-h-[280px] w-full overflow-hidden">
            {isLoading ? (
              <div className="min-h-[280px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : (analyticsData?.volumeByDay?.length ?? 0) > 0 ? (
              <div className="w-full overflow-hidden" style={{ minHeight: 280 }}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analyticsData?.volumeByDay ?? []} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6B21A8" strokeWidth={2} dot={{ fill: '#6B21A8', strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="min-h-[280px] flex items-center justify-center text-muted-foreground text-sm">No volume data for the selected range</div>
            )}
          </CardContent>
        </Card>
        <Card className="flex w-full flex-col shadow-sm border-border/60 min-h-[340px] overflow-hidden">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-base flex items-center gap-2 break-words min-w-0">
              <PieChart className="h-4 w-4 shrink-0" />
              Ticket Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-4 pt-0 pb-4 md:px-6 md:pb-6 min-h-[280px] w-full overflow-hidden">
            {isLoading ? (
              <div className="min-h-[280px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : (analyticsData?.statusData?.length ?? 0) > 0 ? (
              <div className="w-full overflow-hidden" style={{ minHeight: 280 }}>
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPie>
                  <Pie
                    data={analyticsData?.statusData ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(analyticsData?.statusData ?? []).map((_: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" fontSize={11} wrapperStyle={{ paddingLeft: 8 }} />
                </RechartsPie>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="min-h-[280px] flex items-center justify-center text-muted-foreground text-sm">No status data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: SLA Performance by Phase + Resolution Time Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="flex w-full flex-col shadow-sm border-border/60 min-h-[320px] overflow-hidden">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-base flex items-center gap-2 break-words min-w-0">
              <Target className="h-4 w-4 shrink-0" />
              SLA Compliance by Phase
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-4 pt-0 pb-4 md:px-6 md:pb-6 min-h-[260px] w-full overflow-hidden">
            {isLoading ? (
              <div className="min-h-[260px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : slaByPhaseData.length > 0 ? (
              <div className="w-full overflow-hidden" style={{ minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={slaByPhaseData} layout="vertical" margin={{ top: 8, right: 24, left: 72, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" fontSize={12} tickLine={false} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={70} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Compliance']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {slaByPhaseData.map((entry: { fill: string }, index: number) => (
                      <Cell key={`sla-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card className="flex w-full flex-col shadow-sm border-border/60 min-h-[320px] overflow-hidden">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-base flex items-center gap-2 break-words min-w-0">
              <Clock className="h-4 w-4 shrink-0" />
              Resolution Time Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-4 pt-0 pb-4 md:px-6 md:pb-6 min-h-[260px] w-full overflow-hidden">
            {isLoading ? (
              <div className="min-h-[260px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : resolutionTimeByDay.some((d) => d.count > 0) ? (
              <div className="w-full overflow-hidden" style={{ minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={resolutionTimeByDay} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} unit="h" />
                  <Tooltip formatter={(v: number) => [v, 'Avg hours']} />
                  <Line type="monotone" dataKey="avgHours" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="min-h-[260px] flex items-center justify-center text-muted-foreground text-sm">No resolution data for the last 7 days</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Tickets by Category + Tickets by Priority (or Location) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="flex w-full flex-col shadow-sm border-border/60 min-h-[320px] overflow-hidden">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-base flex items-center gap-2 break-words min-w-0">
              <BarChart3 className="h-4 w-4 shrink-0" />
              Tickets by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-4 pt-0 pb-4 md:px-6 md:pb-6 min-h-[260px] w-full overflow-hidden">
            {isLoading ? (
              <div className="min-h-[260px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : (analyticsData?.categoryData?.length ?? 0) > 0 ? (
              <div className="w-full overflow-hidden" style={{ minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analyticsData?.categoryData ?? []} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" fontSize={12} tickLine={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={100} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="min-h-[260px] flex items-center justify-center text-muted-foreground text-sm">No category data</div>
            )}
          </CardContent>
        </Card>
        <Card className="flex w-full flex-col shadow-sm border-border/60 min-h-[320px] overflow-hidden">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-base flex items-center gap-2 break-words min-w-0">
              {priorityData.length > 0 ? <Star className="h-4 w-4 shrink-0" /> : <MapPin className="h-4 w-4 shrink-0" />}
              {priorityData.length > 0 ? 'Tickets by Priority' : 'Tickets by Location'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-4 pt-0 pb-4 md:px-6 md:pb-6 min-h-[260px] w-full overflow-hidden">
            {isLoading ? (
              <div className="min-h-[260px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : priorityData.length > 0 ? (
              <div className="w-full overflow-hidden" style={{ minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <RechartsPie>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {priorityData.map((entry: { fill: string }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" fontSize={11} wrapperStyle={{ paddingLeft: 8 }} />
                </RechartsPie>
              </ResponsiveContainer>
              </div>
            ) : (analyticsData?.locationData?.length ?? 0) > 0 ? (
              <div className="w-full overflow-hidden" style={{ minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analyticsData?.locationData ?? []} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" fontSize={12} tickLine={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={80} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="min-h-[260px] flex items-center justify-center text-muted-foreground text-sm">No priority or location data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (clientReportsMode) {
    return (
      <div className="w-full min-w-0 overflow-x-hidden md:mx-auto md:max-w-7xl px-3 md:px-6 py-6" style={{ minHeight: '100%' }}>
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
