import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useQuery } from "@tanstack/react-query";
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
  Ticket,
  Gauge,
  Users,
  Building2,
  Shield,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { User } from "@/lib/types";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("organizations");
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: organizations = [], isLoading: orgsLoading } = useOrganizations();

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
                {orgsLoading ? "—" : organizations.length}
              </p>
              <p className="text-xs text-muted-foreground">
                By client_slug from tickets
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
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Distinct client_slug from tickets. Click a row to view that organization.
                </p>
              </CardHeader>
              <CardContent>
                {orgsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : organizations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No organizations yet. Tickets with client_slug will appear here.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead className="text-right">Tickets</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations.map((org) => (
                        <TableRow
                          key={org.slug}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/super-admin/org/${encodeURIComponent(org.slug)}`)}
                        >
                          <TableCell className="font-medium">{org.displayName}</TableCell>
                          <TableCell className="font-mono text-sm">{org.slug}</TableCell>
                          <TableCell className="text-right">{org.ticketCount}</TableCell>
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
      </div>
      </PageContainer>
    </AppLayoutNew>
  );
}
