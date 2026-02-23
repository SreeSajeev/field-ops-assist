import { ClientHeader, DashboardFooter } from "@/pages/ClientDashboard";
import Analytics from "@/pages/Analytics";

/**
 * Client Dashboard Reports: same analytics as service staff (charts, CSV export, metrics)
 * but scoped to the signed-in client (user.client_slug). Client selector and admin
 * controls are hidden by Analytics when role is CLIENT. No backend changes.
 */
export default function ClientReports() {
  return (
    <div className="min-h-screen" style={{ background: "hsl(30 5% 98%)" }}>
      <ClientHeader />
      <main className="pt-14">
        <Analytics clientReportsMode />
      </main>
      <DashboardFooter />
    </div>
  );
}
