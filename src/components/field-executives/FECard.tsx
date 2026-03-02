import { FieldExecutiveWithStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Phone, 
  Ticket, 
  Clock, 
  CheckCircle2,
  Wrench,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FECardProps {
  executive: FieldExecutiveWithStats;
  onClick?: (fe: FieldExecutiveWithStats) => void;
  onEdit?: (fe: FieldExecutiveWithStats) => void;
  canEdit?: boolean;
}

export function FECard({ executive, onClick, onEdit, canEdit }: FECardProps) {
  const skills = executive.skills as { categories?: string[] } | null;
  const skillsList = skills?.categories || [];

  const getWorkloadLabel = (activeTickets: number) => {
    if (activeTickets === 0) return 'Available';
    if (activeTickets <= 2) return 'Low';
    if (activeTickets <= 4) return 'Moderate';
    return 'High';
  };

  return (
    <Card 
      className={cn(
        'card-interactive cursor-pointer overflow-hidden',
        !executive.active && 'opacity-60'
      )}
      onClick={() => onClick?.(executive)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white',
                executive.active
                  ? 'bg-gradient-to-br from-primary to-primary/80'
                  : 'bg-muted-foreground'
              )}
            >
              {executive.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base">{executive.name}</CardTitle>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {executive.base_location || 'No location set'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(executive);
                }}
                aria-label="Edit field executive"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
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
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {executive.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span className="font-mono">{executive.phone}</span>
          </div>
        )}

        {skillsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skillsList.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                <Wrench className="h-3 w-3 mr-1" />
                {skill}
              </Badge>
            ))}
            {skillsList.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{skillsList.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Ticket className="h-3.5 w-3.5" />
              Active Tickets
            </div>
            <span className="text-lg font-bold">
              {executive.active_tickets}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {getWorkloadLabel(executive.active_tickets)}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolved (7d)
            </div>
            <span className="text-lg font-bold">
              {executive.resolved_this_week}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">SLA Compliance</span>
            <span className="font-semibold">
              {executive.sla_compliance_rate}%
            </span>
          </div>
          <Progress value={executive.sla_compliance_rate} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Avg. Resolution
          </div>
          <span className="font-medium">
            {executive.avg_resolution_time_hours > 0
              ? `${executive.avg_resolution_time_hours}h`
              : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function FECardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-1.5 w-full" />
      </CardContent>
    </Card>
  );
}
