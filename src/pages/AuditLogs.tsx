import { useState } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Lock,
  Shield,
  User,
  Ticket,
  Truck,
  Settings,
  Mail,
  Clock,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuditLog } from '@/lib/types';

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
  for (const [key, value] of Object.entries(ACTION_COLORS)) {
    if (action.toLowerCase().includes(key)) return value;
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/status changed to/i, 'Status → ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface AuditLogItemProps {
  log: AuditLog;
}

function AuditLogItem({ log }: AuditLogItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const EntityIcon = ENTITY_ICONS[log.entity_type] || FileText;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "border rounded-lg p-4 transition-colors",
        isOpen ? "bg-muted/50 border-primary/30" : "bg-card hover:bg-muted/30"
      )}>
        <CollapsibleTrigger asChild>
          <div className="flex items-start justify-between cursor-pointer">
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                log.entity_type === 'ticket' && "bg-blue-100 text-blue-600",
                log.entity_type === 'assignment' && "bg-purple-100 text-purple-600",
                log.entity_type === 'user' && "bg-green-100 text-green-600",
                log.entity_type === 'field_executive' && "bg-orange-100 text-orange-600",
                !['ticket', 'assignment', 'user', 'field_executive'].includes(log.entity_type) && "bg-muted text-muted-foreground"
              )}>
                <EntityIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn("text-xs", getActionColor(log.action))}>
                    {formatAction(log.action)}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-background">
                    {log.entity_type}
                  </Badge>
                  {log.entity_id && (
                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {log.entity_id.slice(0, 8)}...
                    </code>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(log.created_at), 'PPpp')}
                  </span>
                  {log.performed_by && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      System/User
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0">
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-180"
              )} />
            </Button>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Metadata
              </p>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
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

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Get unique entity types and actions for filters
  const entityTypes = [...new Set(logs?.map(l => l.entity_type) || [])];
  const actionTypes = [...new Set(logs?.map(l => l.action) || [])];

  // Filter logs
  const filteredLogs = (logs || []).filter(log => {
    const matchesSearch = !search || 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.metadata).toLowerCase().includes(search.toLowerCase());
    
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesEntity && matchesAction;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Audit Logs</h1>
              <p className="text-muted-foreground text-sm">
                Complete system activity timeline • Read-only archive
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

        {/* Immutability Notice */}
        <Alert className="bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-600" />
            <Shield className="h-4 w-4 text-slate-600" />
          </div>
          <AlertDescription className="text-sm text-slate-800 ml-2">
            <strong>System Immutable:</strong> Audit logs are permanently recorded and cannot be altered, 
            edited, or deleted by any user role. This ensures legal defensibility and operational transparency.
          </AlertDescription>
        </Alert>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{logs?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{entityTypes.length}</p>
                <p className="text-xs text-muted-foreground">Entity Types</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{actionTypes.length}</p>
                <p className="text-xs text-muted-foreground">Action Types</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {logs?.[0] ? format(new Date(logs[0].created_at), 'HH:mm') : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Last Activity</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map(action => (
                <SelectItem key={action} value={action}>{formatAction(action)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(search || entityFilter !== 'all' || actionFilter !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearch('');
                setEntityFilter('all');
                setActionFilter('all');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs?.length || 0} log entries
        </div>

        {/* Logs List */}
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
              {search || entityFilter !== 'all' || actionFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'System activity will be logged here automatically.'
              }
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
