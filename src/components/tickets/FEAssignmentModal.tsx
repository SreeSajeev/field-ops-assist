import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Star, 
  Truck, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Search,
  Briefcase
} from 'lucide-react';
import { Ticket, FieldExecutive } from '@/lib/types';
import { useFieldExecutivesWithStats } from '@/hooks/useFieldExecutives';
import { useAssignTicket } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

interface FEAssignmentModalProps {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ScoredFE extends FieldExecutive {
  score: number;
  locationMatch: boolean;
  skillMatch: boolean;
  activeTickets: number;
}

export function FEAssignmentModal({ ticket, open, onOpenChange }: FEAssignmentModalProps) {
  const { data: fieldExecutives, isLoading } = useFieldExecutivesWithStats();
  const assignTicket = useAssignTicket();
  const [selectedFE, setSelectedFE] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate recommendations based on location and skill matching
  const scoredExecutives = useMemo(() => {
    if (!fieldExecutives) return [];

    const ticketLocation = ticket.location?.toLowerCase() || '';
    const ticketIssueType = ticket.issue_type?.toLowerCase() || '';
    const ticketCategory = ticket.category?.toLowerCase() || '';

    return fieldExecutives
      .filter(fe => fe.active)
      .map(fe => {
        let score = 0;
        let locationMatch = false;
        let skillMatch = false;

        // Location matching (40 points max)
        const feLocation = fe.base_location?.toLowerCase() || '';
        if (ticketLocation && feLocation) {
          if (ticketLocation.includes(feLocation) || feLocation.includes(ticketLocation)) {
            score += 40;
            locationMatch = true;
          } else {
            // Partial match for city names
            const ticketWords = ticketLocation.split(/[\s,]+/);
            const feWords = feLocation.split(/[\s,]+/);
            const hasCommonWord = ticketWords.some(tw => 
              feWords.some(fw => tw.length > 3 && fw.length > 3 && (tw.includes(fw) || fw.includes(tw)))
            );
            if (hasCommonWord) {
              score += 20;
              locationMatch = true;
            }
          }
        }

        // Skill matching (40 points max)
        const skills = fe.skills as { categories?: string[] } | null;
        const feSkills = skills?.categories || [];
        if (feSkills.length > 0) {
          const skillsLower = feSkills.map(s => s.toLowerCase());
          if (ticketIssueType && skillsLower.some(s => s.includes(ticketIssueType) || ticketIssueType.includes(s))) {
            score += 40;
            skillMatch = true;
          } else if (ticketCategory && skillsLower.some(s => s.includes(ticketCategory) || ticketCategory.includes(s))) {
            score += 20;
            skillMatch = true;
          }
        }

        // Workload penalty (up to -20 points)
        const activeTickets = fe.active_tickets || 0;
        if (activeTickets > 5) {
          score -= 20;
        } else if (activeTickets > 3) {
          score -= 10;
        } else if (activeTickets > 0) {
          score -= 5;
        }

        return {
          ...fe,
          score,
          locationMatch,
          skillMatch,
          activeTickets
        } as ScoredFE;
      })
      .sort((a, b) => b.score - a.score);
  }, [fieldExecutives, ticket]);

  // Get top 2 recommendations
  const recommendations = scoredExecutives.slice(0, 2);
  const isRecommended = (feId: string) => recommendations.some(r => r.id === feId);

  // Filter by search
  const filteredExecutives = scoredExecutives.filter(fe => 
    fe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fe.base_location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedFE) return;

    const needsOverride = !isRecommended(selectedFE) && !overrideReason;
    if (needsOverride) {
      return; // UI will show warning
    }

    await assignTicket.mutateAsync({
      ticketId: ticket.id,
      feId: selectedFE,
      overrideReason: isRecommended(selectedFE) ? undefined : overrideReason
    });

    onOpenChange(false);
    setSelectedFE(null);
    setOverrideReason('');
  };

  const selectedIsRecommended = selectedFE ? isRecommended(selectedFE) : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Assign Field Executive
          </DialogTitle>
          <DialogDescription>
            Select a field executive for ticket <span className="font-mono font-semibold">{ticket.ticket_number}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ticket Context */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{ticket.location || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Issue:</span>
                <span className="font-medium">{ticket.issue_type || ticket.category || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Recommendations Banner */}
          {recommendations.length > 0 && (
            <Alert className="border-primary/50 bg-primary/5">
              <Star className="h-4 w-4 text-primary" />
              <AlertDescription>
                <span className="font-semibold">AI Recommendations:</span> Based on location and skill matching, 
                we recommend <span className="font-medium">{recommendations.map(r => r.name).join(' or ')}</span>.
              </AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search field executives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* FE List */}
          <ScrollArea className="h-[280px] rounded-lg border">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredExecutives.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                No field executives found
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredExecutives.map((fe) => {
                  const recommended = isRecommended(fe.id);
                  const isSelected = selectedFE === fe.id;
                  
                  return (
                    <div
                      key={fe.id}
                      onClick={() => setSelectedFE(fe.id)}
                      className={cn(
                        'relative flex items-center gap-4 rounded-lg border p-3 cursor-pointer transition-all',
                        isSelected 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                          : 'hover:bg-muted/50',
                        recommended && 'border-primary/50'
                      )}
                    >
                      {/* Recommended Badge */}
                      {recommended && (
                        <Badge className="absolute -top-2 right-2 bg-primary text-primary-foreground">
                          <Star className="mr-1 h-3 w-3" />
                          Recommended
                        </Badge>
                      )}

                      {/* Selection Indicator */}
                      <div className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                      </div>

                      {/* FE Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{fe.name}</span>
                          {fe.locationMatch && (
                            <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                              <MapPin className="mr-1 h-3 w-3" />
                              Location Match
                            </Badge>
                          )}
                          {fe.skillMatch && (
                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                              <Briefcase className="mr-1 h-3 w-3" />
                              Skill Match
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {fe.base_location || 'No location'}
                          </span>
                          <span>•</span>
                          <span>{fe.activeTickets} active tickets</span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-sm font-semibold">{fe.score}</div>
                        <div className="text-xs text-muted-foreground">score</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Override Reason (only if selecting non-recommended) */}
          {selectedFE && !selectedIsRecommended && (
            <div className="space-y-2">
              <Label htmlFor="override-reason" className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                Override Reason Required
              </Label>
              <Textarea
                id="override-reason"
                placeholder="Please explain why you're selecting a non-recommended field executive..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                This will be logged for audit purposes.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={
                !selectedFE || 
                assignTicket.isPending || 
                (!selectedIsRecommended && !overrideReason)
              }
            >
              {assignTicket.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Assign to {filteredExecutives.find(fe => fe.id === selectedFE)?.name || 'Selected FE'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
