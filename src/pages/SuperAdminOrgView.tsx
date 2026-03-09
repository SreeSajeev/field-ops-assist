import { useParams, Link } from "react-router-dom";
import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTickets } from "@/hooks/useTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { Ticket as TicketIcon, Gauge, ArrowLeft } from "lucide-react";
import { formatIST } from "@/lib/dateUtils";
import { Ticket } from "@/lib/types";

function slugToDisplayName(slug: string): string {
  const trimmed = String(slug).trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export default function SuperAdminOrgView() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const slug = clientSlug?.trim() ?? "";

  const { data: stats, isLoading: statsLoading } = useDashboardStats(slug || undefined);
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets({
    clientSlug: slug || undefined,
    status: "all",
  });

  const onSiteCount = tickets.filter((t) => t.status === "ON_SITE").length;
  const pendingVerifyCount = tickets.filter(
    (t) => t.status === "RESOLVED_PENDING_VERIFICATION"
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  const totalTickets = stats?.totalTickets ?? 0;
  const slaBreaches = stats?.slaBreaches ?? 0;

  if (!slug) {
    return (
      <AppLayoutNew>
        <PageContainer>
          <div className="space-y-4">
            <Link
              to="/super-admin"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Super Admin
            </Link>
            <p className="text-muted-foreground">Organization not specified.</p>
          </div>
        </PageContainer>
      </AppLayoutNew>
    );
  }

  const displayName = slugToDisplayName(slug);

  return (
    <AppLayoutNew>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link
              to="/super-admin"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Super Admin
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">Organization: {slug}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
                <TicketIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {statsLoading ? "—" : stats?.totalTickets ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {statsLoading ? "—" : stats?.openTickets ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ON_SITE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{ticketsLoading ? "—" : onSiteCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Verify
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {ticketsLoading ? "—" : pendingVerifyCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {ticketsLoading ? "—" : resolvedCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  SLA
                </CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {totalTickets > 0 ? (slaBreaches === 0 ? "On track" : "Alert") : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalTickets > 0 ? `${slaBreaches} breached` : "No tickets"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tickets</CardTitle>
              <p className="text-sm text-muted-foreground">
                All tickets for this organization
              </p>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tickets.</p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tickets as Ticket[]).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-sm">
                          {t.ticket_number}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {t.issue_type || t.category || "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={t.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatIST(t.updated_at, "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/app/tickets/${t.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
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
