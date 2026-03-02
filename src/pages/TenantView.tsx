import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { TicketsTable } from "@/components/tickets/TicketsTable";
import { FECard } from "@/components/field-executives/FECard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTickets } from "@/hooks/useTickets";
import { useFieldExecutivesWithStats } from "@/hooks/useFieldExecutives";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Ticket,
  Users,
  Truck,
  UserCheck,
  ArrowLeft,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { User, UserRole } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<UserRole, string> = {
  STAFF: "Service Manager",
  ADMIN: "Admin",
  FIELD_EXECUTIVE: "Field Executive",
  CLIENT: "Client",
  SUPER_ADMIN: "Super Admin",
};

const apiBase = () => import.meta.env.VITE_CRM_API_URL ?? "http://localhost:3000";

/**
 * Tenant view — Super Admin only.
 * Reuses Dashboard stats, TicketsTable, FE list, Users table logic, and client counts.
 * No new logic; filter by organisation_id only.
 */
const ADD_USER_ROLES: UserRole[] = ["ADMIN", "STAFF", "FIELD_EXECUTIVE", "CLIENT"];

export default function TenantView() {
  const { orgId } = useParams<{ orgId: string }>();
  const queryClient = useQueryClient();
  const { session, signUp } = useAuth();
  const { toast } = useToast();
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUserName, setAddUserName] = useState("");
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserPassword, setAddUserPassword] = useState("");
  const [addUserRole, setAddUserRole] = useState<UserRole>("STAFF");
  const [addUserActive, setAddUserActive] = useState(true);
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["organisation", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organisations")
        .select("id, name, slug, status")
        .eq("id", orgId!)
        .single();
      if (error) throw error;
      return data as { id: string; name: string; slug: string; status: string };
    },
  });

  const { data: stats, isLoading: statsLoading } = useDashboardStats(undefined, orgId ?? undefined);
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets({
    organisationId: orgId ?? undefined,
    status: "all",
    clientSlug: clientFilter ?? undefined,
  });
  const { data: executives, isLoading: feLoading } = useFieldExecutivesWithStats(orgId ?? undefined);

  const { data: clientSlugs } = useQuery({
    queryKey: ["tenant-clients", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("client_slug")
        .eq("organisation_id", orgId!);
      if (error) throw error;
      const slugs = [...new Set((data ?? []).map((t: { client_slug?: string | null }) => t.client_slug).filter(Boolean))] as string[];
      return slugs;
    },
  });

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ["users-tenant", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("organisation_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as User[];
    },
  });

  const { data: clientStats } = useQuery({
    queryKey: ["tenant-client-stats", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("client_slug, status")
        .eq("organisation_id", orgId!);
      if (error) throw error;
      const byClient: Record<string, { total: number; open: number }> = {};
      for (const t of data ?? []) {
        const slug = (t as { client_slug?: string | null }).client_slug ?? "_unknown";
        if (!byClient[slug]) byClient[slug] = { total: 0, open: 0 };
        byClient[slug].total++;
        if ((t as { status: string }).status === "OPEN") byClient[slug].open++;
      }
      return byClient;
    },
  });

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    const token = session?.access_token;
    if (!token) {
      toast({ title: "Not signed in", variant: "destructive" });
      return;
    }
    setStatusPendingId(userId);
    try {
      const res = await fetch(`${apiBase()}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed to update status");
      toast({ title: isActive ? "User activated" : "User deactivated" });
      refetchUsers();
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setStatusPendingId(null);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    const token = session?.access_token;
    if (!token) {
      toast({ title: "Not signed in", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${apiBase()}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed to update role");
      toast({ title: "Role updated" });
      refetchUsers();
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  };

  if (!orgId) {
    return (
      <AppLayoutNew>
        <PageContainer>
          <p className="text-muted-foreground">Missing organisation.</p>
          <Button variant="link" asChild><Link to="/app/organisations">Back to Organisations</Link></Button>
        </PageContainer>
      </AppLayoutNew>
    );
  }

  if (orgLoading || !org) {
    return (
      <AppLayoutNew>
        <PageContainer>
          <p className="text-muted-foreground">Loading tenant…</p>
        </PageContainer>
      </AppLayoutNew>
    );
  }

  return (
    <AppLayoutNew>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/organisations" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Organisations
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{org.name}</h1>
                <p className="text-sm text-muted-foreground">{org.slug}</p>
                <Badge variant={org.status === "active" ? "default" : "secondary"} className="mt-1">
                  {org.status}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="rounded-lg border border-border/60 px-4 py-2">
                <p className="text-xs text-muted-foreground">Tickets</p>
                <p className="text-xl font-bold">{statsLoading ? "—" : stats?.totalTickets ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border/60 px-4 py-2">
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="text-xl font-bold">{statsLoading ? "—" : stats?.openTickets ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border/60 px-4 py-2">
                <p className="text-xs text-muted-foreground">FEs</p>
                <p className="text-xl font-bold">{feLoading ? "—" : (executives?.length ?? 0)}</p>
              </div>
              <div className="rounded-lg border border-border/60 px-4 py-2">
                <p className="text-xs text-muted-foreground">Users</p>
                <p className="text-xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="fes">Field Executives</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.totalTickets ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.openTickets ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Needs Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.needsReviewCount ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">SLA Breaches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.slaBreaches ?? 0}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-4">
              {clientSlugs && clientSlugs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={clientFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setClientFilter(null)}
                  >
                    All
                  </Button>
                  {clientSlugs.map((slug) => (
                    <Button
                      key={slug}
                      variant={clientFilter === slug ? "default" : "outline"}
                      size="sm"
                      onClick={() => setClientFilter(slug)}
                    >
                      {slug}
                    </Button>
                  ))}
                </div>
              )}
              <TicketsTable tickets={tickets} loading={ticketsLoading} />
            </TabsContent>

            <TabsContent value="fes" className="space-y-4">
              {feLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (executives?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No field executives in this tenant.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {executives?.map((fe) => (
                    <FECard
                      key={fe.id}
                      executive={fe}
                      onClick={() => {}}
                      onEdit={() => {}}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">Users in this organisation. Add users or change roles and status.</p>
                <Button size="sm" onClick={() => setAddUserOpen(true)} disabled={!orgId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => {
                        const active = u.is_active !== false && u.active !== false;
                        return (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Select
                                value={u.role}
                                onValueChange={(v) => updateUserRole(u.id, v as UserRole)}
                              >
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="STAFF">{ROLE_LABELS.STAFF}</SelectItem>
                                  <SelectItem value="ADMIN">{ROLE_LABELS.ADMIN}</SelectItem>
                                  <SelectItem value="FIELD_EXECUTIVE">{ROLE_LABELS.FIELD_EXECUTIVE}</SelectItem>
                                  <SelectItem value="CLIENT">{ROLE_LABELS.CLIENT}</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>{active ? "Active" : "Inactive"}</TableCell>
                            <TableCell className="text-right">
                              <Switch
                                checked={active}
                                disabled={statusPendingId === u.id}
                                onCheckedChange={(checked) => updateUserStatus(u.id, !!checked)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">No users in this tenant.</p>
              )}
            </TabsContent>

            <TabsContent value="clients" className="space-y-4">
              {!clientStats || Object.keys(clientStats).length === 0 ? (
                <p className="text-sm text-muted-foreground">No client data (distinct client_slug) for this tenant.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(clientStats).map(([slug, s]) => (
                    <Card key={slug}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          {slug === "_unknown" ? "Unknown" : slug}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{s.total} tickets</p>
                        <p className="text-xs text-muted-foreground">{s.open} open</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>
                Create a user in this organisation. They will sign in with the email and password you set.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-user-name">Name</Label>
                <Input
                  id="add-user-name"
                  value={addUserName}
                  onChange={(e) => setAddUserName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-user-email">Email</Label>
                <Input
                  id="add-user-email"
                  type="email"
                  value={addUserEmail}
                  onChange={(e) => setAddUserEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-user-password">Password</Label>
                <Input
                  id="add-user-password"
                  type="password"
                  value={addUserPassword}
                  onChange={(e) => setAddUserPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={addUserRole} onValueChange={(v) => setAddUserRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADD_USER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="add-user-active">Active</Label>
                <Switch
                  id="add-user-active"
                  checked={addUserActive}
                  onCheckedChange={setAddUserActive}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddUserOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!addUserName.trim() || !addUserEmail.trim() || !addUserPassword || !orgId || addUserSubmitting}
                onClick={async () => {
                  setAddUserSubmitting(true);
                  try {
                    const { error } = await signUp(
                      addUserEmail.trim(),
                      addUserPassword,
                      addUserName.trim(),
                      addUserRole,
                      orgId ?? undefined
                    );
                    if (error) {
                      toast({ title: "Failed to add user", description: error.message, variant: "destructive" });
                      return;
                    }
                    queryClient.invalidateQueries({ queryKey: ["users-tenant", orgId] });
                    toast({ title: "User created", description: "They can sign in with the email and password." });
                    setAddUserOpen(false);
                    setAddUserName("");
                    setAddUserEmail("");
                    setAddUserPassword("");
                    setAddUserRole("STAFF");
                    setAddUserActive(true);
                  } finally {
                    setAddUserSubmitting(false);
                  }
                }}
              >
                {addUserSubmitting ? "Creating…" : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayoutNew>
  );
}
