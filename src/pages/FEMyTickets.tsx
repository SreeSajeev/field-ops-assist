import { useNavigate, Link } from 'react-router-dom';
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

  if (!isFieldExecutive && userProfile) {
    navigate('/');
    return null;
  }

  /* ================= FETCH FE RECORD ================= */

  const { data: feRecord } = useQuery({
    queryKey: ['fe-record', userProfile?.name],
    enabled: !!userProfile?.name,
    queryFn: async () => {
      const { data } = await supabase
        .from('field_executives')
        .select('id')
        .eq('name', userProfile?.name || '')
        .maybeSingle();
      return data;
    }
  });

  /* ================= FETCH ASSIGNED TICKETS ================= */

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['fe-my-tickets', feRecord?.id],
    enabled: !!feRecord?.id,
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from('ticket_assignments')
        .select(`
          id,
          fe_id,
          ticket_id,
          tickets!ticket_assignments_ticket_id_fkey (*)
        `)
        .eq('fe_id', feRecord.id);

      const assignedTickets = (assignments || [])
        .map(a => a.tickets)
        .filter((t): t is Ticket => {
          if (!t) return false;
          const ticket = t as Ticket;
          return ['ASSIGNED', 'ON_SITE', 'RESOLVED_PENDING_VERIFICATION'].includes(ticket.status);
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return assignedTickets as Ticket[];
    }
  });

  /* ================= FETCH ACTIVE TOKENS ================= */

  const { data: tokens } = useQuery({
    queryKey: ['fe-active-tokens', feRecord?.id],
    enabled: !!feRecord?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('fe_action_tokens')
        .select('*')
        .eq('fe_id', feRecord.id)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString());

      return data || [];
    }
  });

  /* ================= STATUS UPDATE (UNCHANGED) ================= */

  const updateStatus = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

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
    }
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
          <Button onClick={() => handleAcknowledge(ticket.id)} className="w-full">
            <PlayCircle className="mr-2 h-4 w-4" />
            Mark as On Site
          </Button>
        );
      case 'ON_SITE':
        return (
          <Button onClick={() => handleMarkComplete(ticket.id)} className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
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

  /* ================= UI ================= */

  return (
    <div className="min-h-screen" style={{ background: 'hsl(285 45% 12%)' }}>
      <main className="max-w-4xl mx-auto px-6 py-8">

        {ticketsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !tickets?.length ? (
          <Card>
            <CardContent className="py-16 text-center">
              <TicketIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
              No Assigned Tickets
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => {
              const ticketToken = tokens?.find(
                (t: any) => t.ticket_id === ticket.id
              );

              return (
                <Card key={ticket.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle>{ticket.ticket_number}</CardTitle>
                      <StatusBadge status={ticket.status} />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">

                    {/* TOKEN BUTTON IF EXISTS */}
                    {ticketToken && (
                      <Link to={`/fe/action/${ticketToken.id}`}>
                        <Button className="w-full bg-primary">
                          Submit {ticketToken.action_type === 'ON_SITE' ? 'On-Site' : 'Resolution'} Proof
                        </Button>
                      </Link>
                    )}

                    {/* NORMAL ACTION BUTTON */}
                    {getActionButton(ticket)}

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
