import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisationsTable } from "@/hooks/useOrganisationsTable";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Shield, Search, Users, UserCheck, UserX, Building2 } from "lucide-react";
import { User, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<UserRole, string> = {
  STAFF: "Service Manager",
  ADMIN: "Admin",
  FIELD_EXECUTIVE: "Field Executive",
  CLIENT: "Client",
  SUPER_ADMIN: "Super Admin",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  STAFF: "bg-blue-100 text-blue-700 border-blue-200",
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
};

const apiBase = () => import.meta.env.VITE_CRM_API_URL ?? "http://localhost:3000";

/**
 * Service Managers — Super Admin (all orgs, filterable) and ADMIN (own org only).
 * Lists users with role IN ('STAFF', 'ADMIN'). UI-only enhancements; same data/API.
 */
export default function ServiceManagers() {
  const { session, userProfile } = useAuth();
  const { toast } = useToast();
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);
  const [orgFilter, setOrgFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const isSuperAdmin = userProfile?.role === "SUPER_ADMIN";
  const adminOrgId = userProfile?.role === "ADMIN" ? userProfile?.organisation_id ?? null : null;

  const { data: organisations = [] } = useOrganisationsTable();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["service-managers", isSuperAdmin ? orgFilter : adminOrgId],
    queryFn: async () => {
      let q = supabase
        .from("users")
        .select("*")
        .eq("role", "STAFF")
        .order("name", { ascending: true });
      if (adminOrgId) q = q.eq("organisation_id", adminOrgId);
      else if (isSuperAdmin && orgFilter) q = q.eq("organisation_id", orgFilter);
      const { data: usersData, error: usersError } = await q;
      if (usersError) throw usersError;
      const orgIds = [...new Set((usersData ?? []).map((u: User) => u.organisation_id).filter(Boolean))] as string[];
      if (orgIds.length === 0) return (usersData ?? []) as (User & { org_name?: string })[];
      const { data: orgsData, error: orgsError } = await supabase
        .from("organisations")
        .select("id, name")
        .in("id", orgIds);
      if (orgsError) throw orgsError;
      const orgMap = Object.fromEntries((orgsData ?? []).map((o: { id: string; name: string }) => [o.id, o.name]));
      return (usersData ?? []).map((u: User & { org_name?: string }) => ({
        ...u,
        org_name: u.organisation_id ? orgMap[u.organisation_id] ?? "—" : "—",
      })) as (User & { org_name?: string })[];
    },
  });

  const isActive = (u: User) => u.is_active !== false && u.active !== false;

  const filteredUsers = useMemo(() => {
    const list = users ?? [];
    if (!search.trim()) return list;
    const s = search.trim().toLowerCase();
    return list.filter(
      (u) =>
        u.name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        (u as User & { org_name?: string }).org_name?.toLowerCase().includes(s)
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const list = users ?? [];
    const active = list.filter(isActive).length;
    const orgIds = new Set(list.map((u) => u.organisation_id).filter(Boolean));
    return {
      total: list.length,
      active,
      inactive: list.length - active,
      orgCount: orgIds.size,
    };
  }, [users]);

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
      refetch();
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setStatusPendingId(null);
      setDeactivateTarget(null);
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
      refetch();
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  };

  return (
    <AppLayoutNew>
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary shadow-sm">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Service Managers</h1>
                <p className="text-sm text-muted-foreground">
                  {isSuperAdmin ? "Staff and Admin users across the platform" : "Staff and Admin in your organisation"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Service Managers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <UserX className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.inactive}</p>
                    <p className="text-xs text-muted-foreground">Inactive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.orgCount}</p>
                    <p className="text-xs text-muted-foreground">Organisations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters: org (SuperAdmin only) + search */}
          <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin && (
              <Select value={orgFilter || "all"} onValueChange={(v) => setOrgFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All organisations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organisations</SelectItem>
                  {(organisations as { id: string; name: string; slug?: string }[]).map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} {org.slug ? `(${org.slug})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table card */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Staff & Admin</CardTitle>
              <p className="text-sm text-muted-foreground">
                Activate/deactivate and change role. Uses existing admin user API.
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {search.trim() ? "No service managers match your search." : "No service managers found."}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border bg-muted/10">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Organisation</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => {
                        const active = isActive(u);
                        const uWithOrg = u as User & { org_name?: string };
                        return (
                          <TableRow key={u.id} className="hover:bg-muted/20">
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell className="text-muted-foreground">{u.email}</TableCell>
                            <TableCell>{uWithOrg.org_name ?? "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs", ROLE_BADGE_CLASS[u.role] ?? "")}>
                                {ROLE_LABELS[u.role] ?? u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={active ? "default" : "secondary"} className={active ? "bg-green-600" : ""}>
                                {active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Switch
                                checked={active}
                                disabled={statusPendingId === u.id}
                                onCheckedChange={(checked) => {
                                  if (checked) updateUserStatus(u.id, true);
                                  else setDeactivateTarget(u);
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {filteredUsers.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Showing {filteredUsers.length} of {users.length} service managers
                </p>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={!!deactivateTarget} onOpenChange={() => setDeactivateTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate user?</AlertDialogTitle>
                <AlertDialogDescription>
                  {deactivateTarget?.name} will lose access immediately. You can reactivate later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deactivateTarget && updateUserStatus(deactivateTarget.id, false)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageContainer>
    </AppLayoutNew>
  );
}
