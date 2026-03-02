import { Link } from "react-router-dom";
import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrganisationsTable } from "@/hooks/useOrganisationsTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Ticket, Users, Truck, UserCheck, ChevronRight } from "lucide-react";
import { Organisation } from "@/lib/types";

/**
 * Organisations list — Super Admin only.
 * Cards with org name, status, tickets, FEs, users, distinct clients.
 * Click → /app/tenant/:orgId
 */
export default function Organisations() {
  const { data: organisations = [], isLoading: orgsLoading } = useOrganisationsTable();

  const { data: perOrgStats, isLoading: statsLoading } = useQuery({
    queryKey: ["organisations-stats", organisations.map((o) => o.id).join(",")],
    enabled: organisations.length > 0,
    queryFn: async () => {
      const orgs = organisations as Organisation[];
      const [ticketsRes, usersRes, feRes, slaRes] = await Promise.all([
        supabase.from("tickets").select("organisation_id, status, client_slug"),
        supabase.from("users").select("organisation_id"),
        supabase.from("field_executives").select("organisation_id"),
        supabase.from("sla_tracking").select("ticket_id, assignment_breached, onsite_breached, resolution_breached"),
      ]);
      if (ticketsRes.error) throw ticketsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (feRes.error) throw feRes.error;
      const tickets = ticketsRes.data ?? [];
      const users = usersRes.data ?? [];
      const fes = feRes.data ?? [];
      const slaData = slaRes.data ?? [];
      const breachedTicketIds = new Set(
        slaData
          .filter(
            (s: { assignment_breached?: boolean; onsite_breached?: boolean; resolution_breached?: boolean }) =>
              s.assignment_breached || s.onsite_breached || s.resolution_breached
          )
          .map((s: { ticket_id: string }) => s.ticket_id)
      );
      const map: Record<
        string,
        {
          totalTickets: number;
          openTickets: number;
          feCount: number;
          userCount: number;
          distinctClients: number;
          slaBreached: number;
        }
      > = {};
      for (const org of orgs) {
        const orgTickets = tickets.filter((t: { organisation_id?: string | null }) => t.organisation_id === org.id);
        const openTickets = orgTickets.filter((t: { status: string }) => t.status === "OPEN").length;
        const clientSlugs = new Set(
          orgTickets.map((t: { client_slug?: string | null }) => t.client_slug).filter(Boolean)
        );
        const breached = orgTickets.filter((t: { id: string }) => breachedTicketIds.has(t.id)).length;
        map[org.id] = {
          totalTickets: orgTickets.length,
          openTickets,
          feCount: fes.filter((f: { organisation_id?: string | null }) => f.organisation_id === org.id).length,
          userCount: users.filter((u: { organisation_id?: string | null }) => u.organisation_id === org.id).length,
          distinctClients: clientSlugs.size,
          slaBreached: breached,
        };
      }
      return map;
    },
  });

  if (orgsLoading) {
    return (
      <AppLayoutNew>
        <PageContainer>
          <p className="text-sm text-muted-foreground">Loading organisations…</p>
        </PageContainer>
      </AppLayoutNew>
    );
  }

  return (
    <AppLayoutNew>
      <PageContainer>
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Organisations</h1>
              <p className="text-sm text-muted-foreground">
                Tenant cards. Click to open tenant view.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(organisations as Organisation[]).map((org) => {
              const s = statsLoading ? null : perOrgStats?.[org.id];
              return (
                <Link
                  key={org.id}
                  to={`/app/tenant/${encodeURIComponent(org.id)}`}
                  className="block"
                >
                  <Card className="h-full border-border/60 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <CardTitle className="text-base">{org.name}</CardTitle>
                      <Badge variant={org.status === "active" ? "default" : "secondary"}>
                        {org.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Ticket className="h-4 w-4" />
                        <span>{s?.totalTickets ?? "—"} tickets</span>
                        {s != null && s.openTickets > 0 && (
                          <span className="text-amber-600">({s.openTickets} open)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Truck className="h-4 w-4" />
                        <span>{s?.feCount ?? "—"} FEs</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{s?.userCount ?? "—"} users</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserCheck className="h-4 w-4" />
                        <span>{s?.distinctClients ?? "—"} clients</span>
                      </div>
                      {s != null && s.slaBreached > 0 && (
                        <p className="text-xs text-destructive font-medium">
                          {s.slaBreached} SLA breached
                        </p>
                      )}
                      <div className="pt-2 flex items-center gap-1 text-primary text-sm font-medium">
                        Tenant view <ChevronRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {organisations.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No organisations yet.
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </AppLayoutNew>
  );
}
