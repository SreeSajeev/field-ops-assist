import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useOrganisationsTable, useCreateOrganisation } from "@/hooks/useOrganisationsTable";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Ticket,
  Gauge,
  Users,
  Building2,
  Shield,
  RefreshCw,
  BarChart3,
  UserPlus,
  Plus,
} from "lucide-react";
import { User, UserRole } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const ROLES_FOR_ORG: UserRole[] = ["ADMIN", "STAFF", "FIELD_EXECUTIVE", "CLIENT"];
const ROLE_DISPLAY_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  STAFF: "Service Manager",
  FIELD_EXECUTIVE: "Field Executive",
  CLIENT: "Client",
  SUPER_ADMIN: "Super Admin",
};

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("organizations");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { signUp } = useAuth();

  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [createOrgName, setCreateOrgName] = useState("");
  const [createOrgSlug, setCreateOrgSlug] = useState("");

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUserName, setAddUserName] = useState("");
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserPassword, setAddUserPassword] = useState("");
  const [addUserRole, setAddUserRole] = useState<UserRole>("STAFF");
  const [addUserOrgId, setAddUserOrgId] = useState<string>("");
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: organisations = [], isLoading: orgsLoading } = useOrganisationsTable();
  const createOrgMutation = useCreateOrganisation();

  const { data: slaCount } = useQuery({
    queryKey: ["sla-tracking-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sla_tracking")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as User[];
    },
  });

  const totalSla = slaCount ?? 0;
  const slaBreaches = stats?.slaBreaches ?? 0;
  const slaCompliancePct =
    totalSla > 0
      ? (((totalSla - slaBreaches) / totalSla) * 100).toFixed(1)
      : "—";
  const activeUsers = users?.filter((u) => u.active).length ?? 0;

  return (
    <AppLayoutNew>
      <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Super Admin</h1>
              <p className="text-sm text-muted-foreground">
                Global overview and SaaS management
              </p>
            </div>
          </div>
        </div>

        {/* Top cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tickets
              </CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {statsLoading ? "—" : stats?.totalTickets ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                SLA Compliance
              </CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{slaCompliancePct}%</p>
              <p className="text-xs text-muted-foreground">
                {totalSla} tracked · {slaBreaches} breached
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {usersLoading ? "—" : activeUsers}
              </p>
              <p className="text-xs text-muted-foreground">
                {users?.length ?? 0} total users
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {orgsLoading ? "—" : organisations.length}
              </p>
              <p className="text-xs text-muted-foreground">
                SaaS organisations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">Global Users</TabsTrigger>
            <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Organizations</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    SaaS organisations. Create one, then add users under it.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setCreateOrgOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organisation
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAddUserOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {orgsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : organisations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No organisations yet. Create one to get started.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organisations.map((org) => (
                        <TableRow
                          key={org.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/super-admin/org/${encodeURIComponent(org.slug)}`)}
                        >
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell className="font-mono text-sm">{org.slug}</TableCell>
                          <TableCell>
                            <Badge variant={org.status === "active" ? "default" : "secondary"}>
                              {org.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Global Users</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    All system users across the platform
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/app/users">
                    Open full Users page
                    <RefreshCw className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading users…</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(users ?? []).slice(0, 20).map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {u.active ? (
                              <span className="text-green-600">Active</span>
                            ) : (
                              <span className="text-muted-foreground">Inactive</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>System Metrics</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Key operational metrics (same data as Dashboard & Analytics)
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/app/analytics">
                    Open Analytics
                    <BarChart3 className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-sm text-muted-foreground">Open Tickets</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? "—" : stats?.openTickets ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-sm text-muted-foreground">Needs Review</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? "—" : stats?.needsReviewCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-sm text-muted-foreground">Assigned</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? "—" : stats?.assignedTickets ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-sm text-muted-foreground">Avg Confidence</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? "—" : stats?.avgConfidenceScore ?? "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Organisation modal */}
        <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organisation</DialogTitle>
              <DialogDescription>
                Add a new organisation. Slug must be unique (e.g. sreemarketing).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="org-name">Name</Label>
                <Input
                  id="org-name"
                  value={createOrgName}
                  onChange={(e) => {
                    setCreateOrgName(e.target.value);
                    if (!createOrgSlug) setCreateOrgSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, "-"));
                  }}
                  placeholder="e.g. Sree Marketing"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-slug">Slug</Label>
                <Input
                  id="org-slug"
                  value={createOrgSlug}
                  onChange={(e) => setCreateOrgSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="e.g. sreemarketing"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOrgOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!createOrgName.trim() || !createOrgSlug.trim() || createOrgMutation.isPending}
                onClick={async () => {
                  try {
                    await createOrgMutation.mutateAsync({ name: createOrgName.trim(), slug: createOrgSlug.trim().toLowerCase().replace(/\s+/g, "-") });
                    toast({ title: "Organisation created" });
                    setCreateOrgOpen(false);
                    setCreateOrgName("");
                    setCreateOrgSlug("");
                  } catch (err) {
                    toast({
                      title: "Failed to create organisation",
                      description: err instanceof Error ? err.message : "Unknown error",
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

        {/* Add User under Organisation modal */}
        <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>
                Create a user under an organisation. They will only see that organisation&apos;s data.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user-name">Name</Label>
                <Input
                  id="user-name"
                  value={addUserName}
                  onChange={(e) => setAddUserName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={addUserEmail}
                  onChange={(e) => setAddUserEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
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
                    {ROLES_FOR_ORG.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_DISPLAY_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Organisation</Label>
                <Select value={addUserOrgId} onValueChange={setAddUserOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    {organisations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>{org.name} ({org.slug})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddUserOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!addUserName.trim() || !addUserEmail.trim() || !addUserPassword || !addUserOrgId || addUserSubmitting}
                onClick={async () => {
                  setAddUserSubmitting(true);
                  try {
                    const { error } = await signUp(
                      addUserEmail.trim(),
                      addUserPassword,
                      addUserName.trim(),
                      addUserRole,
                      addUserOrgId
                    );
                    if (error) {
                      toast({ title: "Failed to add user", description: error.message, variant: "destructive" });
                      return;
                    }
                    queryClient.invalidateQueries({ queryKey: ["users"] });
                    toast({ title: "User created. They can sign in with the email and password." });
                    setAddUserOpen(false);
                    setAddUserName("");
                    setAddUserEmail("");
                    setAddUserPassword("");
                    setAddUserRole("STAFF");
                    setAddUserOrgId("");
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
      </div>
      </PageContainer>
    </AppLayoutNew>
  );
}
