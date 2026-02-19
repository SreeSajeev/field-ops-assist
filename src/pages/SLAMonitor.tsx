import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInMinutes, differenceInHours, isPast, startOfDay, endOfDay, subDays } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Timer,
  Pause,
  ExternalLink,
  Info,
  Download,
  Users,
  Tag,
  Star,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SLATracking, Ticket } from '@/lib/types';

interface SLAWithTicket extends SLATracking {
  ticket: Ticket;
  feName?: string;
  feId?: string;
}

type SLAStatus = 'on-track' | 'at-risk' | 'breached' | 'paused';

const PAGE_SIZE = 50;
const BREACH_TREND_DAYS = 7;

function getSLAStatus(deadline: string | null, breached: boolean, ticketStatus: string): { status: SLAStatus; timeRemaining: string } {
  if (ticketStatus === 'NEEDS_REVIEW' || ticketStatus === 'RESOLVED_PENDING_VERIFICATION') {
    return { status: 'paused', timeRemaining: 'Paused' };
  }
  if (breached) return { status: 'breached', timeRemaining: 'Breached' };
  if (!deadline) return { status: 'on-track', timeRemaining: 'N/A' };
  const deadlineDate = new Date(deadline);
  const now = new Date();
  if (isPast(deadlineDate)) return { status: 'breached', timeRemaining: 'Breached' };
  const minutesRemaining = differenceInMinutes(deadlineDate, now);
  const hoursRemaining = differenceInHours(deadlineDate, now);
  if (minutesRemaining < 120) {
    if (minutesRemaining < 60) return { status: 'at-risk', timeRemaining: `${minutesRemaining}m left` };
    return { status: 'at-risk', timeRemaining: `${hoursRemaining}h ${minutesRemaining % 60}m left` };
  }
  if (hoursRemaining < 24) return { status: 'on-track', timeRemaining: `${hoursRemaining}h ${minutesRemaining % 60}m left` };
  const daysRemaining = Math.floor(hoursRemaining / 24);
  return { status: 'on-track', timeRemaining: `${daysRemaining}d ${hoursRemaining % 24}h left` };
}

function isRowBreached(sla: SLAWithTicket): boolean {
  return !!(sla.assignment_breached || sla.onsite_breached || sla.resolution_breached);
}

function matchesBreachType(sla: SLAWithTicket, breachType: string): boolean {
  if (breachType === 'all') return true;
  if (breachType === 'assignment') return !!sla.assignment_breached;
  if (breachType === 'onsite') return !!sla.onsite_breached;
  if (breachType === 'resolution') return !!sla.resolution_breached;
  return true;
}

function getWorstStatus(sla: SLAWithTicket): SLAStatus {
  const a = getSLAStatus(sla.assignment_deadline, sla.assignment_breached, sla.ticket.status).status;
  const b = getSLAStatus(sla.onsite_deadline, sla.onsite_breached, sla.ticket.status).status;
  const c = getSLAStatus(sla.resolution_deadline, sla.resolution_breached, sla.ticket.status).status;
  if (a === 'breached' || b === 'breached' || c === 'breached') return 'breached';
  if (a === 'at-risk' || b === 'at-risk' || c === 'at-risk') return 'at-risk';
  if (a === 'paused' || b === 'paused' || c === 'paused') return 'paused';
  return 'on-track';
}

function SLAStatusIndicator({ status }: { status: SLAStatus }) {
  const config = {
    'on-track': { icon: CheckCircle, label: 'On Track', className: 'text-green-600 bg-green-50 border-green-200' },
    'at-risk': { icon: AlertTriangle, label: 'At Risk', className: 'text-amber-600 bg-amber-50 border-amber-200' },
    'breached': { icon: XCircle, label: 'Breached', className: 'text-red-600 bg-red-50 border-red-200' },
    'paused': { icon: Pause, label: 'Paused', className: 'text-blue-600 bg-blue-50 border-blue-200' },
  };
  const { icon: Icon, label, className } = config[status];
  return (
    <Badge variant="outline" className={cn('gap-1.5', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function CountdownTimer({ deadline, breached, ticketStatus }: { deadline: string | null; breached: boolean; ticketStatus: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);
  const { status, timeRemaining } = getSLAStatus(deadline, breached, ticketStatus);
  return (
    <div className="flex items-center gap-2">
      <SLAStatusIndicator status={status} />
      <span className={cn('text-sm font-medium', status === 'breached' && 'text-red-600', status === 'at-risk' && 'text-amber-600', status === 'paused' && 'text-blue-600')}>
        {timeRemaining}
      </span>
      {status === 'paused' && (
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Timer paused — awaiting verification or review</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

interface FilterState {
  status: string;
  breachType: string;
  feId: string;
  startDate: string;
  endDate: string;
}

interface DerivedStats {
  filteredRows: SLAWithTicket[];
  total: number;
  onTrack: number;
  atRisk: number;
  breached: number;
  paused: number;
  overdueCount: number;
  breachTrendLast7: { date: string; dayLabel: string; count: number }[];
  byFE: { feName: string; count: number }[];
  byCategory: { name: string; count: number }[];
  byPriority: { name: string; count: number }[];
}

function inDateRange(rowDate: string | null | undefined, startDate: string, endDate: string): boolean {
  if (!rowDate) return true;
  const row = new Date(rowDate);
  if (isNaN(row.getTime())) return true;
  if (startDate && startDate.trim()) {
    const start = startOfDay(new Date(startDate.trim()));
    if (row < start) return false;
  }
  if (endDate && endDate.trim()) {
    const end = endOfDay(new Date(endDate.trim()));
    if (row > end) return false;
  }
  return true;
}

export default function SLAMonitor() {
  const [filter, setFilter] = useState<'all' | 'at-risk' | 'breached'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [breachTypeFilter, setBreachTypeFilter] = useState<string>('all');
  const [feFilter, setFeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data: slaData, isLoading, refetch } = useQuery({
    queryKey: ['sla-tracking-with-tickets', statusFilter, breachTypeFilter, feFilter, startDate, endDate],
    queryFn: async (): Promise<SLAWithTicket[]> => {
      const { data: slaRecords, error: slaError } = await supabase
        .from('sla_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (slaError) throw slaError;

      const ticketIds = slaRecords?.map((s) => s.ticket_id) || [];
      const { data: tickets, error: ticketsError } = await supabase.from('tickets').select('*').in('id', ticketIds);

      if (ticketsError) throw ticketsError;

      const ticketMap = new Map((tickets || []).map((t) => [t.id, t as Ticket]));
      const list: SLAWithTicket[] = (slaRecords || [])
        .map((sla) => {
          const ticket = ticketMap.get(sla.ticket_id);
          if (!ticket) return null;
          return { ...sla, ticket, feName: undefined, feId: undefined } as SLAWithTicket;
        })
        .filter((s): s is SLAWithTicket => s !== null);

      if (list.length === 0) return list;

      const { data: assignments, error: assignError } = await supabase
        .from('ticket_assignments')
        .select('id, ticket_id, fe_id, assigned_at')
        .in('ticket_id', ticketIds)
        .order('assigned_at', { ascending: false });

      if (assignError) return list;

      const assignmentByTicket = new Map<string, { fe_id: string; assigned_at: string }>();
      (assignments || []).forEach((a: { ticket_id: string; fe_id: string; assigned_at: string }) => {
        if (!assignmentByTicket.has(a.ticket_id)) assignmentByTicket.set(a.ticket_id, { fe_id: a.fe_id, assigned_at: a.assigned_at });
      });

      const ticketToFeId = new Map<string, string>();
      const assList = assignments as { id: string; ticket_id: string; fe_id: string }[] | null;
      list.forEach((row) => {
        const t = row.ticket as Ticket & { current_assignment_id?: string | null };
        const aid = t.current_assignment_id;
        let feId: string | undefined;
        if (aid && assList?.length) {
          const ass = assList.find((x) => x.id === aid);
          if (ass) feId = ass.fe_id;
        }
        if (!feId) {
          const a = assignmentByTicket.get(row.ticket_id);
          if (a) feId = a.fe_id;
        }
        if (feId) ticketToFeId.set(row.ticket_id, feId);
      });

      const feIds = [...new Set(ticketToFeId.values())];
      if (feIds.length === 0) return list.map((row) => ({ ...row, feId: ticketToFeId.get(row.ticket_id) }));

      const { data: fes, error: fesError } = await supabase.from('field_executives').select('id, name').in('id', feIds);

      if (fesError) return list.map((row) => ({ ...row, feId: ticketToFeId.get(row.ticket_id) }));

      const feNameById = new Map((fes || []).map((f: { id: string; name: string }) => [f.id, f.name]));

      return list.map((row) => {
        const feId = ticketToFeId.get(row.ticket_id);
        const feName = feId ? feNameById.get(feId) ?? '—' : undefined;
        return { ...row, feName, feId };
      });
    },
    refetchInterval: 60000,
  });

  const filterState: FilterState = useMemo(
    () => ({ status: statusFilter, breachType: breachTypeFilter, feId: feFilter, startDate, endDate }),
    [statusFilter, breachTypeFilter, feFilter, startDate, endDate]
  );

  const derived = useMemo((): DerivedStats => {
    const raw = slaData ?? [];
    const stats = {
      onTrack: 0,
      atRisk: 0,
      breached: 0,
      paused: 0,
      overdueCount: 0,
      breachByDay: new Map<string, number>(),
      byFEMap: new Map<string, number>(),
      byCategoryMap: new Map<string, number>(),
      byPriorityMap: new Map<string, number>(),
    };
    const filtered: SLAWithTicket[] = [];

    for (let i = 0; i < raw.length; i++) {
      const sla = raw[i];
      const ticket = sla.ticket;

      if (filterState.status !== 'all' && ticket.status !== filterState.status) continue;
      if (!matchesBreachType(sla, filterState.breachType)) continue;
      if (filterState.feId && sla.feId !== filterState.feId) continue;
      const rowCreatedAt = (sla as SLATracking).created_at;
      if (!inDateRange(rowCreatedAt, filterState.startDate, filterState.endDate)) continue;

      const worst = getWorstStatus(sla);
      const passesDisplayFilter = filter === 'all' || (filter === 'breached' && worst === 'breached') || (filter === 'at-risk' && (worst === 'at-risk' || worst === 'breached'));

      if (isRowBreached(sla)) {
        stats.overdueCount++;
        if (rowCreatedAt) {
          const dayStr = format(new Date(rowCreatedAt), 'yyyy-MM-dd');
          stats.breachByDay.set(dayStr, (stats.breachByDay.get(dayStr) ?? 0) + 1);
        }
        if (sla.feName !== undefined) {
          const name = sla.feName || '—';
          stats.byFEMap.set(name, (stats.byFEMap.get(name) ?? 0) + 1);
        }
        if (ticket && 'category' in ticket) {
          const cat = ticket.category ?? 'Uncategorized';
          stats.byCategoryMap.set(cat, (stats.byCategoryMap.get(cat) ?? 0) + 1);
        }
        if (ticket && 'priority' in ticket && typeof (ticket as Ticket & { priority?: boolean }).priority === 'boolean') {
          const pri = (ticket as Ticket & { priority?: boolean }).priority ? 'Priority' : 'Normal';
          stats.byPriorityMap.set(pri, (stats.byPriorityMap.get(pri) ?? 0) + 1);
        }
      }

      if (passesDisplayFilter) {
        filtered.push(sla);
        stats.onTrack += worst === 'on-track' ? 1 : 0;
        stats.atRisk += worst === 'at-risk' ? 1 : 0;
        stats.breached += worst === 'breached' ? 1 : 0;
        stats.paused += worst === 'paused' ? 1 : 0;
      }
    }

    const total = filtered.length;
    const now = new Date();
    const trend: { date: string; dayLabel: string; count: number }[] = [];
    for (let d = BREACH_TREND_DAYS - 1; d >= 0; d--) {
      const day = subDays(now, d);
      const dayStr = format(day, 'yyyy-MM-dd');
      trend.push({ date: dayStr, dayLabel: format(day, 'EEE MM/dd'), count: stats.breachByDay.get(dayStr) ?? 0 });
    }

    return {
      filteredRows: filtered,
      total,
      onTrack: stats.onTrack,
      atRisk: stats.atRisk,
      breached: stats.breached,
      paused: stats.paused,
      overdueCount: stats.overdueCount,
      breachTrendLast7: trend,
      byFE: [...stats.byFEMap.entries()].map(([feName, count]) => ({ feName, count })).sort((a, b) => b.count - a.count),
      byCategory: [...stats.byCategoryMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      byPriority: [...stats.byPriorityMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    };
  }, [slaData, filterState, filter]);

  const { filteredRows, total, onTrack, atRisk, breached, paused, overdueCount, breachTrendLast7, byFE, byCategory, byPriority } = derived;

  const paginatedRows = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(from, from + PAGE_SIZE);
  }, [filteredRows, page]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const uniqueFEOptions = useMemo(() => {
    const m = new Map<string, string>();
    slaData?.forEach((row) => {
      if (row.feId && row.feName != null) m.set(row.feId, row.feName);
    });
    return [...m.entries()].map(([feId, feName]) => ({ feId, feName })).sort((a, b) => a.feName.localeCompare(b.feName));
  }, [slaData]);

  const handleExport = useCallback(() => {
    const headers = ['ticket_number', 'status', 'category', 'assignment_breached', 'onsite_breached', 'resolution_breached', 'fe_name', 'created_at'];
    const rows = filteredRows.map((sla) => {
      const t = sla.ticket;
      return [
        t.ticket_number ?? '',
        t.status ?? '',
        t.category ?? '',
        String(!!sla.assignment_breached),
        String(!!sla.onsite_breached),
        String(!!sla.resolution_breached),
        sla.feName ?? '',
        (sla as SLATracking).created_at ?? '',
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sla-monitor-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredRows]);

  useEffect(() => setPage(1), [statusFilter, breachTypeFilter, feFilter, startDate, endDate, filter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SLA Monitor</h1>
              <p className="text-muted-foreground text-sm">Real-time SLA tracking with countdown timers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredRows.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <strong>SLA Timer Rules:</strong> Timers automatically pause when tickets are in{' '}
            <strong>NEEDS_REVIEW</strong> or <strong>PENDING_VERIFICATION</strong> status. Timers resume upon assignment confirmation or FE action.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground">Overdue SLA</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{breachTrendLast7.reduce((s, d) => s + d.count, 0)}</p>
                  <p className="text-xs text-muted-foreground">Breaches (last 7 days)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {byFE.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-violet-600" />
                  <div>
                    <p className="text-lg font-bold truncate" title={byFE[0].feName}>{byFE[0].feName}</p>
                    <p className="text-xs text-muted-foreground">Top FE by breaches ({byFE[0].count})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {byCategory.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-lg font-bold truncate" title={byCategory[0].name}>{byCategory[0].name}</p>
                    <p className="text-xs text-muted-foreground">Top category ({byCategory[0].count})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {byPriority.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-lg font-bold">{byPriority[0].name}</p>
                    <p className="text-xs text-muted-foreground">Breaches ({byPriority[0].count})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{filteredRows.length}</p>
                  <p className="text-xs text-muted-foreground">Filtered total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Timer className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{filteredRows.length}</p>
                <p className="text-xs text-muted-foreground">Total Active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{onTrack}</p>
                <p className="text-xs text-green-700">On Track</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Pause className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">{paused}</p>
                <p className="text-xs text-blue-700">Paused</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <p className="text-2xl font-bold text-amber-600">{atRisk}</p>
                <p className="text-xs text-amber-700">At Risk</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{breached}</p>
                <p className="text-xs text-red-700">Breached</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {breachTrendLast7.some((d) => d.count > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Breach trend (last 7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={breachTrendLast7}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dayLabel" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | 'at-risk' | 'breached')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SLAs</SelectItem>
              <SelectItem value="at-risk">At Risk & Breached</SelectItem>
              <SelectItem value="breached">Breached Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ticket status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="OPEN">OPEN</SelectItem>
              <SelectItem value="RESOLVED">RESOLVED</SelectItem>
              <SelectItem value="ASSIGNED">ASSIGNED</SelectItem>
              <SelectItem value="ON_SITE">ON_SITE</SelectItem>
              <SelectItem value="RESOLVED_PENDING_VERIFICATION">PENDING_VERIFICATION</SelectItem>
              <SelectItem value="NEEDS_REVIEW">NEEDS_REVIEW</SelectItem>
            </SelectContent>
          </Select>
          <Select value={breachTypeFilter} onValueChange={setBreachTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Breach type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All breach types</SelectItem>
              <SelectItem value="assignment">Assignment</SelectItem>
              <SelectItem value="onsite">Onsite</SelectItem>
              <SelectItem value="resolution">Resolution</SelectItem>
            </SelectContent>
          </Select>
          {uniqueFEOptions.length > 0 && (
            <Select value={feFilter} onValueChange={setFeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="FE" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All FEs</SelectItem>
                {uniqueFEOptions.map((opt) => (
                  <SelectItem key={opt.feId} value={opt.feId}>
                    {opt.feName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="sla-start" className="text-xs text-muted-foreground whitespace-nowrap">From</Label>
            <Input id="sla-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sla-end" className="text-xs text-muted-foreground whitespace-nowrap">To</Label>
            <Input id="sla-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
          </div>
          <span className="text-sm text-muted-foreground">
            Showing {paginatedRows.length} of {filteredRows.length} (page {page}/{totalPages})
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading SLA data...</p>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center p-8">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Clock className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No SLA records found</h3>
            <p className="text-sm text-muted-foreground mt-1">SLA tracking will appear here when tickets are created.</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Ticket</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Assignment SLA</TableHead>
                    <TableHead className="font-semibold">On-Site SLA</TableHead>
                    <TableHead className="font-semibold">Resolution SLA</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((sla, idx) => (
                    <TableRow key={sla.id} className={cn('data-table-row', idx % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                      <TableCell>
                        <div>
                          <Link to={`/app/tickets/${sla.ticket_id}`} className="font-mono text-sm font-semibold text-primary hover:underline">
                            {sla.ticket.ticket_number}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">{sla.ticket.issue_type || sla.ticket.category || 'Unclassified'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {sla.ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <CountdownTimer deadline={sla.assignment_deadline} breached={sla.assignment_breached} ticketStatus={sla.ticket.status} />
                      </TableCell>
                      <TableCell>
                        <CountdownTimer deadline={sla.onsite_deadline} breached={sla.onsite_breached} ticketStatus={sla.ticket.status} />
                      </TableCell>
                      <TableCell>
                        <CountdownTimer deadline={sla.resolution_deadline} breached={sla.resolution_breached} ticketStatus={sla.ticket.status} />
                      </TableCell>
                      <TableCell>
                        <Link to={`/app/tickets/${sla.ticket_id}`} className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
