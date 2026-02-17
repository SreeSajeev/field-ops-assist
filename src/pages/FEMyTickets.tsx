
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, TicketStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { 
  Truck, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  LogOut,
  Shield,
  PlayCircle,
  Loader2,
  Ticket as TicketIcon
} from 'lucide-react';

export default function FEMyTickets() {
  const { user, userProfile, signOut, isFieldExecutive } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect non-FE users
  if (!isFieldExecutive && userProfile) {
    navigate('/');
    return null;
  }

  // Fetch FE's assigned tickets using email match to field_executives
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['fe-my-tickets', user?.email],
    queryFn: async () => {
      // First, find the field_executive record for this user
      // We match by name from the users table since FE record was created on signup
      const { data: feRecord, error: feError } = await supabase
        .from('field_executives')
        .select('id')
        .eq('name', userProfile?.name || '')
        .maybeSingle();

      if (feError) throw feError;
      if (!feRecord) return [];

      // Now fetch tickets assigned to this FE
      const { data: assignments, error: assignError } = await supabase
        .from('ticket_assignments')
        .select(`
          id,
          fe_id,
          ticket_id,
          tickets!ticket_assignments_ticket_id_fkey (*)
        `)
        .eq('fe_id', feRecord.id);

      if (assignError) throw assignError;

      // Extract tickets that have current_assignment_id matching
      const assignedTickets = (assignments || [])
        .map(a => a.tickets)
        .filter((t): t is Ticket => {
          if (!t) return false;
          const ticket = t as Ticket;
          // Only show tickets that are currently assigned to this FE
          return ['ASSIGNED', 'ON_SITE', 'RESOLVED_PENDING_VERIFICATION'].includes(ticket.status);
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return assignedTickets as Ticket[];
    },
    enabled: !!userProfile?.name
  });
    // Fetch active tokens for this FE
const { data: feTokens } = useQuery({
  queryKey: ['fe-active-tokens', userProfile?.name],
  enabled: !!userProfile?.name,
  queryFn: async () => {
    // Find FE record first
    const { data: feRecord } = await supabase
      .from('field_executives')
      .select('id')
      .eq('name', userProfile?.name || '')
      .maybeSingle();

    if (!feRecord) return [];

    const { data } = await (supabase as any)
      .from('fe_action_tokens')
      .select('*')
      .eq('fe_id', feRecord.id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString());


    return data || [];
  }
});

  // Mutation to update ticket status
  const updateStatus = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      // Add audit log
      await supabase.from('audit_logs').insert({
        entity_type: 'ticket',
        entity_id: ticketId,
        action: `fe_status_changed_to_${status}`,
        metadata: { new_status: status, fe_name: userProfile?.name }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fe-my-tickets'] });
      toast({
        title: 'Status updated',
        description: 'The ticket status has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
      console.error('Update status error:', error);
    },
  });

  const handleAcknowledge = (ticketId: string) => {
    updateStatus.mutate({ ticketId, status: 'ON_SITE' });
  };

  const handleMarkComplete = (ticketId: string) => {
    updateStatus.mutate({ ticketId, status: 'RESOLVED_PENDING_VERIFICATION' as TicketStatus });
  };

  const getActionButton = (ticket: Ticket) => {
    switch (ticket.status) {
      case 'ASSIGNED':
        return (
          <Button 
            onClick={() => handleAcknowledge(ticket.id)}
            disabled={updateStatus.isPending}
            className="w-full"
          >
            {updateStatus.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            Mark as On Site
          </Button>
        );
      case 'ON_SITE':
        return (
          <Button 
            onClick={() => handleMarkComplete(ticket.id)}
            disabled={updateStatus.isPending}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {updateStatus.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Mark Work Complete
          </Button>
        );
      case 'RESOLVED_PENDING_VERIFICATION':
        return (
          <Badge variant="outline" className="w-full justify-center py-2 border-amber-500 text-amber-600">
            <Clock className="mr-2 h-4 w-4" />
            Awaiting Staff Verification
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'hsl(285 45% 12%)' }}>
      {/* Header */}
      <header className="border-b px-6 py-4" style={{ borderColor: 'hsl(285 35% 20%)', background: 'hsl(285 45% 16%)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl logo-glow"
                 style={{ background: 'linear-gradient(135deg, hsl(32 95% 48%), hsl(32 95% 55%))' }}>
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">LogiCRM</h1>
              <p className="text-xs text-white/60">Field Executive Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{userProfile?.name || user?.email}</p>
              <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                <Truck className="mr-1 h-3 w-3" />
                Field Executive
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-white/70 hover:text-white hover:bg-white/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">My Assigned Tickets</h2>
          <p className="text-white/60">
            View and manage tickets assigned to you. Update status as you progress through each job.
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 border-primary/30 bg-primary/10">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-white/80">
            <strong>Workflow:</strong> Mark tickets as "On Site" when you arrive, then "Work Complete" when finished. 
            Service Staff will verify and close the ticket.
          </AlertDescription>
        </Alert>

        {/* Tickets Grid */}
        {ticketsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !tickets?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <TicketIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Assigned Tickets</h3>
              <p className="text-muted-foreground max-w-sm">
                You don't have any tickets assigned to you yet. Check back later or contact your supervisor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-mono text-lg">{ticket.ticket_number}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created {format(new Date(ticket.created_at), 'PPp')}
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Ticket Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium">{ticket.location || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Issue Type</p>
                        <p className="font-medium">{ticket.issue_type || ticket.category || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {ticket.vehicle_number && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">Vehicle Number</p>
                      <p className="font-mono font-semibold">{ticket.vehicle_number}</p>
                    </div>
                  )}

                  {/* Action Button */}
        <div className="pt-2 space-y-2">

          {/* 🔥 SHOW TOKEN IF EXISTS */}
          {feTokens?.find(t => t.ticket_id === ticket.id) && (
            <Button
              onClick={() =>
                navigate(`/fe/action/${feTokens.find(t => t.ticket_id === ticket.id)?.id}`)
              }
              className="w-full bg-primary hover:bg-primary/90"
            >
              Submit {
                feTokens.find(t => t.ticket_id === ticket.id)?.action_type === 'ON_SITE'
                  ? 'On-Site'
                  : 'Resolution'
              } Proof
            </Button>
          )}

  {getActionButton(ticket)}

</div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


