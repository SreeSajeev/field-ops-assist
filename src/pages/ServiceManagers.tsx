import { useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { RefreshCw, Shield } from "lucide-react";
import { User, UserRole } from "@/lib/types";
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
 * Service Managers — Super Admin only.
 * Lists users with role IN ('STAFF', 'ADMIN').
 * Reuses existing user status/role update API.
 */
export default function ServiceManagers() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["service-managers"],
    queryFn: async () => {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .in("role", ["STAFF", "ADMIN"])
        .order("name", { ascending: true });
      if (usersError) throw usersError;
      const orgIds = [...new Set((usersData ?? []).map((u: User) => u.organisation_id).filter(Boolean))] as string[];
      if (orgIds.length === 0) return (usersData ?? []) as User[];
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Service Managers</h1>
                <p className="text-sm text-muted-foreground">
                  Staff and Admin users across the platform
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Staff & Admin</CardTitle>
              <p className="text-sm text-muted-foreground">
                Activate/deactivate and change role. Uses existing admin user API.
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No service managers found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Organisation</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => {
                        const active = isActive(u);
                        const uWithOrg = u as User & { org_name?: string };
                        return (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{uWithOrg.org_name ?? "—"}</TableCell>
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
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge variant={active ? "default" : "secondary"}>
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
