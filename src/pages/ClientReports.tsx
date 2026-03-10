import { DashboardFooter } from "@/pages/ClientDashboard";
import Analytics from "@/pages/Analytics";

/**
 * Client Dashboard Reports: same analytics as Service Manager (charts, CSV export, metrics)
 * but scoped to the signed-in client (user.client_slug). Client selector and admin
 * controls are hidden by Analytics when role is CLIENT. No backend changes.
 * Layout (header, background) from ClientLayout.
 */
export default function ClientReports() {
  return (
    <>
      <section className="py-6 md:py-8 min-w-0 overflow-x-hidden">
        <div className="w-full min-w-0 md:mx-auto md:max-w-7xl px-3 md:px-6">
          <Analytics clientReportsMode />
        </div>
      </section>
      <DashboardFooter />
    </>
  );
}
