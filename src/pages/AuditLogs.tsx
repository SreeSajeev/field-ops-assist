import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  Shield,
  User,
  Ticket,
  Truck,
  Settings,
  Mail,
  Clock,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuditLog } from '@/lib/types';

const PAGE_SIZE = 50;

const ENTITY_ICONS: Record<string, React.ElementType> = {
  ticket: Ticket,
  user: User,
  field_executive: Truck,
  assignment: Truck,
  email: Mail,
  sla: Clock,
  config: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700 border-green-200',
  assigned: 'bg-purple-100 text-purple-700 border-purple-200',
  status_changed: 'bg-blue-100 text-blue-700 border-blue-200',
  updated: 'bg-amber-100 text-amber-700 border-amber-200',
  deleted: 'bg-red-100 text-red-700 border-red-200',
  viewed: 'bg-gray-100 text-gray-700 border-gray-200',
};

function getActionColor(action: string): string {
  if (!action || typeof action !== 'string') return 'bg-gray-100 text-gray-700 border-gray-200';
  const lower = action.toLowerCase();
  for (const [key, value] of Object.entries(ACTION_COLORS)) {
    if (lower.includes(key)) return value;
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function formatAction(action: string): string {
  if (!action || typeof action !== 'string') return '—';
  return action
    .replace(/_/g, ' ')
    .replace(/status changed to/i, 'Status → ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface AuditLogItemProps {
  log: AuditLog;
}

function AuditLogItem({ log }: AuditLogItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const entityType = log?.entity_type ?? 'unknown';
  const EntityIcon = ENTITY_ICONS[entityType] || FileText;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          'border rounded-lg p-4 transition-colors',
          isOpen ? 'bg-muted/50 border-primary/30' : 'bg-card hover:bg-muted/30'
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-start justify-between cursor-pointer">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  entityType === 'ticket' && 'bg-blue-100 text-blue-600',
                  entityType === 'assignment' && 'bg-purple-100 text-purple-600',
                  entityType === 'user' && 'bg-green-100 text-green-600',
                  entityType === 'field_executive' && 'bg-orange-100 text-orange-600',
                  !['ticket', 'assignment', 'user', 'field_executive'].includes(entityType) && 'bg-muted text-muted-foreground'
                )}
              >
                <EntityIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn('text-xs', getActionColor(log.action))}>
                    {formatAction(log.action)}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-background">
                    {entityType}
                  </Badge>
                  {log.entity_id != null && String(log.entity_id).length > 0 && (
                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {String(log.entity_id).slice(0, 8)}...
                    </code>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {log.created_at ? format(new Date(log.created_at), 'PPpp') : '—'}
                  </span>
                  {log.performed_by != null && String(log.performed_by).length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      System/User
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0">
              <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {log.metadata != null && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Metadata</p>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
            </div>
          )}
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>Log ID: {log.id}</span>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function matchesSearch(log: AuditLog, q: string): boolean {
  if (!q || !q.trim()) return true;
  const lower = q.trim().toLowerCase();
  const action = log?.action != null ? String(log.action).toLowerCase() : '';
  const entityType = log?.entity_type != null ? String(log.entity_type).toLowerCase() : '';
  const entityId = log?.entity_id != null ? String(log.entity_id).toLowerCase() : '';
  const meta = log?.metadata != null ? JSON.stringify(log.metadata).toLowerCase() : '';
  return action.includes(lower) || entityType.includes(lower) || entityId.includes(lower) || meta.includes(lower);
}

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, entityFilter, actionFilter]);

  const offset = Math.max(0, (page - 1) * PAGE_SIZE);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', page, dateFrom, dateTo, entityFilter, actionFilter],
    queryFn: async (): Promise<AuditLog[]> => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFrom && dateFrom.trim()) {
        const start = startOfDay(new Date(dateFrom.trim()));
        if (!isNaN(start.getTime())) query = query.gte('created_at', start.toISOString());
      }
      if (dateTo && dateTo.trim()) {
        const end = endOfDay(new Date(dateTo.trim()));
        if (!isNaN(end.getTime())) query = query.lte('created_at', end.toISOString());
      }
      if (entityFilter && entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (actionFilter && actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });

  const filteredLogs = useMemo(() => {
    const list = logs ?? [];
    if (!search || !search.trim()) return list;
    return list.filter((log) => matchesSearch(log, search));
  }, [logs, search]);

  const entityTypes = useMemo(() => {
    const list = logs ?? [];
    const set = new Set<string>();
    list.forEach((l) => {
      if (l.entity_type != null && String(l.entity_type).trim()) set.add(String(l.entity_type));
    });
    return [...set].sort();
  }, [logs]);

  const actionTypes = useMemo(() => {
    const list = logs ?? [];
    const set = new Set<string>();
    list.forEach((l) => {
      if (l.action != null && String(l.action).trim()) set.add(String(l.action));
    });
    return [...set].sort();
  }, [logs]);

  const aggregations = useMemo(() => {
    const list = logs ?? [];
    const actionCount = new Map<string, number>();
    const userCount = new Map<string, number>();

    list.forEach((l) => {
      const action = l?.action != null ? String(l.action) : '—';
      actionCount.set(action, (actionCount.get(action) ?? 0) + 1);
      const performer = l?.performed_by != null ? String(l.performed_by) : null;
      if (performer) userCount.set(performer, (userCount.get(performer) ?? 0) + 1);
    });

    const actionFrequency = [...actionCount.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topUser =
      userCount.size > 0
        ? [...userCount.entries()].sort((a, b) => b[1] - a[1])[0]
        : null;

    return { actionFrequency, topUser: topUser ? { id: topUser[0], count: topUser[1] } : null };
  }, [logs]);

  const hasNextPage = (logs?.length ?? 0) >= PAGE_SIZE;
  const hasPrevPage = page > 1;

  const handleExportLogs = useCallback(() => {
    const rows = filteredLogs;
    if (rows.length === 0) return;
    const headers = ['id', 'entity_type', 'entity_id', 'action', 'performed_by', 'created_at', 'metadata'];
    const csvRows = rows.map((log) =>
      headers
        .map((h) => {
          const v = (log as unknown as Record<string, unknown>)[h];
          if (v == null) return '';
          if (typeof v === 'object') return JSON.stringify(v);
          return String(v);
        })
        .join(',')
    );
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  const handleExportSummary = useCallback(() => {
    const { actionFrequency, topUser } = aggregations;
    const rows: [string, string][] = [
      ['Metric', 'Value'],
      ['Action frequency (top 10)', ''],
      ...actionFrequency.slice(0, 10).map((a): [string, string] => [a.name, String(a.count)]),
      ['', ''],
      ['Most active user (this page)', topUser ? `${topUser.id} (${topUser.count} actions)` : '—'],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [aggregations]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Audit Logs</h1>
              <p className="text-muted-foreground text-sm">Complete system activity timeline • Read-only archive</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportLogs} disabled={filteredLogs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export logs
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSummary}>
              <Download className="h-4 w-4 mr-2" />
              Export summary
            </Button>
          </div>
        </div>

        <Alert className="bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-600" />
            <Shield className="h-4 w-4 text-slate-600" />
          </div>
          <AlertDescription className="text-sm text-slate-800 ml-2">
            <strong>System Immutable:</strong> Audit logs are permanently recorded and cannot be altered, edited, or deleted by any user role.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{logs?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">This page</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{entityTypes.length}</p>
                <p className="text-xs text-muted-foreground">Entity types</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{aggregations.actionFrequency[0]?.count ?? 0}</p>
                <p className="text-xs text-muted-foreground truncate" title={aggregations.actionFrequency[0]?.name}>
                  Top action
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{aggregations.topUser ? aggregations.topUser.count : '—'}</p>
                <p className="text-xs text-muted-foreground">Most active user (page)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search (action, entity, metadata)..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="audit-date-from" className="text-xs text-muted-foreground whitespace-nowrap">
              From
            </Label>
            <Input id="audit-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="audit-date-to" className="text-xs text-muted-foreground whitespace-nowrap">
              To
            </Label>
            <Input id="audit-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actionTypes.map((action) => (
                <SelectItem key={action} value={action}>
                  {formatAction(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || dateFrom || dateTo || entityFilter !== 'all' || actionFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setDateFrom('');
                setDateTo('');
                setEntityFilter('all');
                setActionFilter('all');
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs?.length ?? 0} on this page {search ? '(filtered by search)' : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!hasPrevPage || isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">Page {page}</span>
            <Button variant="outline" size="sm" disabled={!hasNextPage || isLoading} onClick={() => setPage((p) => p + 1)}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading audit logs...</p>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center p-8">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No audit logs found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search || dateFrom || dateTo || entityFilter !== 'all' || actionFilter !== 'all'
                ? 'Try adjusting filters or search.'
                : 'System activity will be logged here automatically.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <AuditLogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
