import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInMinutes, differenceInHours, isPast } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Timer,
  Pause,
  Play,
  ExternalLink,
  TrendingUp,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SLATracking, Ticket } from '@/lib/types';

interface SLAWithTicket extends SLATracking {
  ticket: Ticket;
}

type SLAStatus = 'on-track' | 'at-risk' | 'breached' | 'paused';
type SLAType = 'assignment' | 'onsite' | 'resolution';

function getSLAStatus(deadline: string | null, breached: boolean, ticketStatus: string): { status: SLAStatus; timeRemaining: string } {
  // Paused states
  if (ticketStatus === 'NEEDS_REVIEW' || ticketStatus === 'RESOLVED_PENDING_VERIFICATION') {
    return { status: 'paused', timeRemaining: 'Paused' };
  }

  if (breached) {
    return { status: 'breached', timeRemaining: 'Breached' };
  }

  if (!deadline) {
    return { status: 'on-track', timeRemaining: 'N/A' };
  }

  const deadlineDate = new Date(deadline);
  const now = new Date();

  if (isPast(deadlineDate)) {
    return { status: 'breached', timeRemaining: 'Breached' };
  }

  const minutesRemaining = differenceInMinutes(deadlineDate, now);
  const hoursRemaining = differenceInHours(deadlineDate, now);

  // At risk if less than 2 hours remaining
  if (minutesRemaining < 120) {
    if (minutesRemaining < 60) {
      return { status: 'at-risk', timeRemaining: `${minutesRemaining}m left` };
    }
    return { status: 'at-risk', timeRemaining: `${hoursRemaining}h ${minutesRemaining % 60}m left` };
  }

  if (hoursRemaining < 24) {
    return { status: 'on-track', timeRemaining: `${hoursRemaining}h ${minutesRemaining % 60}m left` };
  }

  const daysRemaining = Math.floor(hoursRemaining / 24);
  return { status: 'on-track', timeRemaining: `${daysRemaining}d ${hoursRemaining % 24}h left` };
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

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const { status, timeRemaining } = getSLAStatus(deadline, breached, ticketStatus);

  return (
    <div className="flex items-center gap-2">
      <SLAStatusIndicator status={status} />
      <span className={cn(
        'text-sm font-medium',
        status === 'breached' && 'text-red-600',
        status === 'at-risk' && 'text-amber-600',
        status === 'paused' && 'text-blue-600'
      )}>
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

export default function SLAMonitor() {
  const [filter, setFilter] = useState<'all' | 'at-risk' | 'breached'>('all');
  
  const { data: slaData, isLoading, refetch } = useQuery({
    queryKey: ['sla-tracking-with-tickets'],
    queryFn: async () => {
      // Fetch SLA tracking with ticket data
      const { data: slaRecords, error: slaError } = await supabase
        .from('sla_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (slaError) throw slaError;

      // Fetch associated tickets
      const ticketIds = slaRecords?.map(s => s.ticket_id) || [];
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .in('id', ticketIds);

      if (ticketsError) throw ticketsError;

      const ticketMap = new Map(tickets?.map(t => [t.id, t]) || []);

      return (slaRecords || []).map(sla => ({
        ...sla,
        ticket: ticketMap.get(sla.ticket_id),
      })).filter(s => s.ticket) as SLAWithTicket[];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Calculate summary stats
  const stats = {
    total: slaData?.length || 0,
    onTrack: 0,
    atRisk: 0,
    breached: 0,
    paused: 0,
  };

  slaData?.forEach(sla => {
    const assignmentStatus = getSLAStatus(sla.assignment_deadline, sla.assignment_breached, sla.ticket.status).status;
    const onsiteStatus = getSLAStatus(sla.onsite_deadline, sla.onsite_breached, sla.ticket.status).status;
    const resolutionStatus = getSLAStatus(sla.resolution_deadline, sla.resolution_breached, sla.ticket.status).status;

    // Take the worst status
    const statuses = [assignmentStatus, onsiteStatus, resolutionStatus];
    if (statuses.includes('breached')) stats.breached++;
    else if (statuses.includes('at-risk')) stats.atRisk++;
    else if (statuses.includes('paused')) stats.paused++;
    else stats.onTrack++;
  });

  // Filter data
  const filteredData = slaData?.filter(sla => {
    if (filter === 'all') return true;
    
    const assignmentStatus = getSLAStatus(sla.assignment_deadline, sla.assignment_breached, sla.ticket.status).status;
    const onsiteStatus = getSLAStatus(sla.onsite_deadline, sla.onsite_breached, sla.ticket.status).status;
    const resolutionStatus = getSLAStatus(sla.resolution_deadline, sla.resolution_breached, sla.ticket.status).status;
    const statuses = [assignmentStatus, onsiteStatus, resolutionStatus];

    if (filter === 'breached') return statuses.includes('breached');
    if (filter === 'at-risk') return statuses.includes('at-risk') || statuses.includes('breached');
    return true;
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SLA Monitor</h1>
              <p className="text-muted-foreground text-sm">
                Real-time SLA tracking with countdown timers
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

        {/* SLA Rules Explanation */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <strong>SLA Timer Rules:</strong> Timers automatically pause when tickets are in{' '}
            <strong>NEEDS_REVIEW</strong> or <strong>PENDING_VERIFICATION</strong> status.
            Timers resume upon assignment confirmation or FE action.
          </AlertDescription>
        </Alert>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Timer className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{stats.onTrack}</p>
                <p className="text-xs text-green-700">On Track</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Pause className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">{stats.paused}</p>
                <p className="text-xs text-blue-700">Paused</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <p className="text-2xl font-bold text-amber-600">{stats.atRisk}</p>
                <p className="text-xs text-amber-700">At Risk</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{stats.breached}</p>
                <p className="text-xs text-red-700">Breached</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SLAs</SelectItem>
              <SelectItem value="at-risk">At Risk & Breached</SelectItem>
              <SelectItem value="breached">Breached Only</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {stats.total} SLA records
          </span>
        </div>

        {/* SLA Table */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading SLA data...</p>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center p-8">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Clock className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No SLA records found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              SLA tracking will appear here when tickets are created.
            </p>
          </div>
        ) : (
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
                {filteredData.map((sla, idx) => (
                  <TableRow 
                    key={sla.id}
                    className={cn(
                      "data-table-row",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                  >
                    <TableCell>
                      <div>
                        <Link 
                          to={`/tickets/${sla.ticket_id}`}
                          className="font-mono text-sm font-semibold text-primary hover:underline"
                        >
                          {sla.ticket.ticket_number}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {sla.ticket.issue_type || sla.ticket.category || 'Unclassified'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {sla.ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CountdownTimer 
                        deadline={sla.assignment_deadline} 
                        breached={sla.assignment_breached} 
                        ticketStatus={sla.ticket.status}
                      />
                    </TableCell>
                    <TableCell>
                      <CountdownTimer 
                        deadline={sla.onsite_deadline} 
                        breached={sla.onsite_breached} 
                        ticketStatus={sla.ticket.status}
                      />
                    </TableCell>
                    <TableCell>
                      <CountdownTimer 
                        deadline={sla.resolution_deadline} 
                        breached={sla.resolution_breached} 
                        ticketStatus={sla.ticket.status}
                      />
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/tickets/${sla.ticket_id}`}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
