import { Link } from "react-router-dom";
import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrganisationsTable } from "@/hooks/useOrganisationsTable";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Ticket,
  Users,
  Truck,
  UserCheck,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { Organisation } from "@/lib/types";

/**
 * Platform Overview — Super Admin only.
 * Aggregates: orgs, tickets, open tickets, FEs, users, distinct clients.
 * Uses existing Supabase queries; no new schema.
 */
export default function PlatformOverview() {
  const { data: organisations = [], isLoading: orgsLoading } = useOrganisationsTable();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["platform-counts"],
    queryFn: async () => {
      const [usersRes, feRes, ticketsRes] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("field_executives").select("id", { count: "exact", head: true }),
        supabase.from("tickets").select("id, client_slug"),
      ]);
      if (usersRes.error) throw usersRes.error;
      if (feRes.error) throw feRes.error;
      if (ticketsRes.error) throw ticketsRes.error;
      const distinctClients = new Set(
        (ticketsRes.data ?? []).map((t: { client_slug?: string | null }) => t.client_slug).filter(Boolean)
      ).size;
      return {
        totalUsers: usersRes.count ?? 0,
        totalFEs: feRes.count ?? 0,
        distinctClients,
      };
    },
  });

  const { data: perOrgStats, isLoading: perOrgLoading } = useQuery({
    queryKey: ["platform-per-org-stats", organisations.length],
    enabled: organisations.length > 0,
    queryFn: async () => {
      const [ticketsRes, usersRes, feRes] = await Promise.all([
        supabase.from("tickets").select("organisation_id, status, client_slug"),
        supabase.from("users").select("organisation_id"),
        supabase.from("field_executives").select("organisation_id"),
      ]);
      if (ticketsRes.error) throw ticketsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (feRes.error) throw feRes.error;
      const tickets = ticketsRes.data ?? [];
      const users = usersRes.data ?? [];
      const fes = feRes.data ?? [];
      const map: Record<
        string,
        { totalTickets: number; openTickets: number; feCount: number; userCount: number; distinctClients: number }
      > = {};
      for (const org of organisations as Organisation[]) {
        const orgId = org.id;
        const orgTickets = tickets.filter((t: { organisation_id?: string | null }) => t.organisation_id === orgId);
        const openTickets = orgTickets.filter((t: { status: string }) => t.status === "OPEN").length;
        const clientSlugs = new Set(
          orgTickets.map((t: { client_slug?: string | null }) => t.client_slug).filter(Boolean)
        );
        map[orgId] = {
          totalTickets: orgTickets.length,
          openTickets,
          feCount: fes.filter((f: { organisation_id?: string | null }) => f.organisation_id === orgId).length,
          userCount: users.filter((u: { organisation_id?: string | null }) => u.organisation_id === orgId).length,
          distinctClients: clientSlugs.size,
        };
      }
      return map;
    },
  });

  const isLoading = statsLoading || countsLoading;
  const statCards = [
    {
      title: "Total Organisations",
      value: orgsLoading ? "—" : organisations.length,
      icon: Building2,
      sub: "SaaS tenants",
    },
    {
      title: "Total Tickets",
      value: statsLoading ? "—" : stats?.totalTickets ?? 0,
      icon: Ticket,
      sub: "All time",
    },
    {
      title: "Open Tickets",
      value: statsLoading ? "—" : stats?.openTickets ?? 0,
      icon: Ticket,
      sub: "Awaiting action",
    },
    {
      title: "Field Executives",
      value: countsLoading ? "—" : counts?.totalFEs ?? 0,
      icon: Truck,
      sub: "Across platform",
    },
    {
      title: "Total Users",
      value: countsLoading ? "—" : counts?.totalUsers ?? 0,
      icon: Users,
      sub: "All roles",
    },
    {
      title: "Active Clients",
      value: countsLoading ? "—" : counts?.distinctClients ?? 0,
      icon: UserCheck,
      sub: "Distinct client_slug",
    },
  ];

  return (
    <AppLayoutNew>
      <PageContainer>
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary">
              <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Platform Overview</h1>
              <p className="text-sm text-muted-foreground">
                Multi-tenant SaaS control panel
              </p>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {statCards.map((item) => (
              <Card key={item.title} className="border-border/60 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {item.title}
                  </CardTitle>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Organisations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tenant list with key metrics. Click a row to open tenant view.
              </p>
            </CardHeader>
            <CardContent>
              {orgsLoading || perOrgLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : organisations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No organisations yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Tickets</TableHead>
                        <TableHead className="text-right">Open</TableHead>
                        <TableHead className="text-right">FEs</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Clients</TableHead>
                        <TableHead className="w-[80px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(organisations as Organisation[]).map((org) => {
                        const s = perOrgStats?.[org.id];
                        return (
                          <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>
                              <Badge variant={org.status === "active" ? "default" : "secondary"}>
                                {org.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{s?.totalTickets ?? "—"}</TableCell>
                            <TableCell className="text-right">{s?.openTickets ?? "—"}</TableCell>
                            <TableCell className="text-right">{s?.feCount ?? "—"}</TableCell>
                            <TableCell className="text-right">{s?.userCount ?? "—"}</TableCell>
                            <TableCell className="text-right">{s?.distinctClients ?? "—"}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/app/tenant/${encodeURIComponent(org.id)}`}>
                                  View <ChevronRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayoutNew>
  );
}
