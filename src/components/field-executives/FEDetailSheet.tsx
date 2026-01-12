import { FieldExecutive } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Phone, 
  Calendar, 
  Ticket, 
  Clock, 
  TrendingUp,
  CheckCircle2,
  User,
  Wrench,
  AlertTriangle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FEDetailSheetProps {
  executive: FieldExecutive | null;
  stats?: {
    active_tickets: number;
    resolved_this_week: number;
    avg_resolution_time_hours: number;
    sla_compliance_rate: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FEDetailSheet({ 
  executive, 
  stats,
  open, 
  onOpenChange 
}: FEDetailSheetProps) {
  if (!executive) return null;

  const skills = executive.skills as { categories?: string[]; certifications?: string[] } | null;
  const skillsList = skills?.categories || [];
  const certifications = skills?.certifications || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-0">
        <SheetHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-start gap-4">
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white',
              executive.active 
                ? 'bg-gradient-to-br from-primary to-primary/80' 
                : 'bg-muted-foreground'
            )}>
              {executive.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl">{executive.name}</SheetTitle>
                <Badge 
                  variant={executive.active ? 'default' : 'secondary'}
                  className={cn(
                    'text-xs',
                    executive.active && 'bg-green-500/10 text-green-600 border-green-200'
                  )}
                >
                  {executive.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Field Executive</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="px-6 py-4 space-y-6">
            {/* Info Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                This is a <strong>view-only</strong> profile page. Ticket assignments are made from the Ticket Detail page.
              </AlertDescription>
            </Alert>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {executive.phone && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </div>
                    <p className="text-sm font-medium font-mono">{executive.phone}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Base Location
                  </div>
                  <p className="text-sm font-medium">{executive.base_location || 'Not set'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined
                  </div>
                  <p className="text-sm font-medium">
                    {executive.created_at 
                      ? format(new Date(executive.created_at), 'MMM d, yyyy')
                      : '—'
                    }
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Skills & Certifications */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Skills & Certifications
              </h3>
              
              {skillsList.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Device Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {skillsList.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-sm">
                          <Wrench className="h-3 w-3 mr-1.5" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {certifications.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {certifications.map((cert) => (
                          <Badge key={cert} variant="outline" className="text-sm">
                            <CheckCircle2 className="h-3 w-3 mr-1.5 text-green-600" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills configured</p>
              )}
            </div>

            <Separator />

            {/* Performance Metrics */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Performance Metrics
              </h3>
              
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Ticket className="h-3.5 w-3.5" />
                        Active Tickets
                      </div>
                      <p className="text-2xl font-bold">{stats.active_tickets}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolved (7 days)
                      </div>
                      <p className="text-2xl font-bold">{stats.resolved_this_week}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3.5 w-3.5" />
                        Avg. Resolution
                      </div>
                      <p className="text-2xl font-bold">
                        {stats.avg_resolution_time_hours > 0 
                          ? `${stats.avg_resolution_time_hours}h` 
                          : '—'
                        }
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        SLA Compliance
                      </div>
                      <p className={cn(
                        'text-2xl font-bold',
                        stats.sla_compliance_rate >= 90 && 'text-green-600',
                        stats.sla_compliance_rate >= 70 && stats.sla_compliance_rate < 90 && 'text-amber-600',
                        stats.sla_compliance_rate < 70 && 'text-red-600'
                      )}>
                        {stats.sla_compliance_rate}%
                      </p>
                    </div>
                  </div>

                  {/* SLA Compliance Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Overall SLA Compliance</span>
                      <span className="font-medium">{stats.sla_compliance_rate}%</span>
                    </div>
                    <Progress 
                      value={stats.sla_compliance_rate} 
                      className="h-2"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No performance data available</p>
              )}
            </div>

            <Separator />

            {/* Workload Warning */}
            {stats && stats.active_tickets > 4 && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">
                  This FE has a <strong>high workload</strong> with {stats.active_tickets} active tickets. 
                  Consider assigning new tickets to other available FEs.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}