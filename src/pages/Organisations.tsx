import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganisationsTable, useCreateOrganisation } from "@/hooks/useOrganisationsTable";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Building2, Ticket, Users, Truck, UserCheck, ChevronRight, Plus, UserPlus } from "lucide-react";
import { Organisation } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

/**
 * Organisations list — Super Admin only.
 * Cards with org name, status, tickets, FEs, users, distinct clients.
 * Click → /app/tenant/:orgId
 */
export default function Organisations() {
  const { userProfile, signUp } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");

  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [createAdminOrgId, setCreateAdminOrgId] = useState<string | null>(null);
  const [createAdminName, setCreateAdminName] = useState("");
  const [createAdminEmail, setCreateAdminEmail] = useState("");
  const [createAdminPassword, setCreateAdminPassword] = useState("");
  const [createAdminSubmitting, setCreateAdminSubmitting] = useState(false);

  const { data: organisations = [], isLoading: orgsLoading } = useOrganisationsTable();
  const createOrgMutation = useCreateOrganisation();
  const isSuperAdmin = userProfile?.role === "SUPER_ADMIN";

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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Organisations</h1>
                <p className="text-sm text-muted-foreground">
                  Tenant cards. Click to open tenant view.
                </p>
              </div>
            </div>
            {isSuperAdmin && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Organisation
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(organisations as Organisation[]).map((org) => {
              const s = statsLoading ? null : perOrgStats?.[org.id];
              return (
                <Card key={org.id} className="h-full border-border/60 shadow-sm transition-shadow hover:shadow-md flex flex-col">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-base">{org.name}</CardTitle>
                    <Badge variant={org.status === "active" ? "default" : "secondary"}>
                      {org.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 flex-1 flex flex-col">
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
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          setCreateAdminOrgId(org.id);
                          setCreateAdminOpen(true);
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Create Admin
                      </Button>
                      <Link
                        to={`/app/tenant/${encodeURIComponent(org.id)}`}
                        className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline"
                      >
                        Tenant view <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
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

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Organisation</DialogTitle>
              <DialogDescription>
                Add a new tenant organisation. Name and slug are required. Slug will be stored lowercase with spaces replaced by hyphens.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="org-name">Organisation Name</Label>
                <Input
                  id="org-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-slug">Slug</Label>
                <Input
                  id="org-slug"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                  placeholder="acme-corp"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!createName.trim() || !createSlug.trim() || createOrgMutation.isPending}
                onClick={async () => {
                  const name = createName.trim();
                  const slug = createSlug.trim().toLowerCase().replace(/\s+/g, "-");
                  if (!name || !slug) return;
                  try {
                    await createOrgMutation.mutateAsync({ name, slug });
                    toast({ title: "Organisation created", description: `${name} is now available. You can assign an admin next.` });
                    setCreateOpen(false);
                    setCreateName("");
                    setCreateSlug("");
                  } catch (err) {
                    toast({
                      title: "Failed to create organisation",
                      description: err instanceof Error ? err.message : "Something went wrong",
                      variant: "destructive",
                    });
                  }
                }}
              >
                {createOrgMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Admin for organisation */}
        <Dialog
          open={createAdminOpen}
          onOpenChange={(open) => {
            setCreateAdminOpen(open);
            if (!open) {
              setCreateAdminOrgId(null);
              setCreateAdminName("");
              setCreateAdminEmail("");
              setCreateAdminPassword("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Organisation Admin</DialogTitle>
              <DialogDescription>
                Create an admin user for this organisation. They will manage only this tenant (tickets, users, field executives).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="admin-name">Name</Label>
                <Input
                  id="admin-name"
                  value={createAdminName}
                  onChange={(e) => setCreateAdminName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={createAdminEmail}
                  onChange={(e) => setCreateAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={createAdminPassword}
                  onChange={(e) => setCreateAdminPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {createAdminOrgId && (
                <p className="text-xs text-muted-foreground">
                  Organisation: {(organisations as Organisation[]).find((o) => o.id === createAdminOrgId)?.name ?? createAdminOrgId}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateAdminOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={
                  !createAdminName.trim() ||
                  !createAdminEmail.trim() ||
                  !createAdminPassword ||
                  !createAdminOrgId ||
                  createAdminSubmitting
                }
                onClick={async () => {
                  if (!createAdminOrgId) return;
                  setCreateAdminSubmitting(true);
                  try {
                    const { error } = await signUp(
                      createAdminEmail.trim(),
                      createAdminPassword,
                      createAdminName.trim(),
                      "ADMIN",
                      createAdminOrgId
                    );
                    if (error) {
                      toast({
                        title: "Failed to create admin",
                        description: error.message,
                        variant: "destructive",
                      });
                      return;
                    }
                    queryClient.invalidateQueries({ queryKey: ["users"] });
                    queryClient.invalidateQueries({ queryKey: ["organisations-stats"] });
                    toast({
                      title: "Organisation Admin created",
                      description: "They can sign in with the email and password.",
                    });
                    setCreateAdminOpen(false);
                    setCreateAdminOrgId(null);
                    setCreateAdminName("");
                    setCreateAdminEmail("");
                    setCreateAdminPassword("");
                  } catch (err) {
                    toast({
                      title: "Failed to create admin",
                      description: err instanceof Error ? err.message : "Something went wrong",
                      variant: "destructive",
                    });
                  } finally {
                    setCreateAdminSubmitting(false);
                  }
                }}
              >
                {createAdminSubmitting ? "Creating…" : "Create Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayoutNew>
  );
}
