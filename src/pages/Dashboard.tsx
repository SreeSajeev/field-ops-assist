import { Link } from "react-router-dom";
import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import { TicketsTable } from "@/components/tickets/TicketsTable";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTickets } from "@/hooks/useTickets";
import {
  Ticket,
  AlertTriangle,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Gradient divider (Sahaya design language)
const GradientDivider = () => (
  <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(285 45% 55% / 0.18), hsl(32 95% 52% / 0.10), transparent)" }} />
);

// Metric card with reference styling (primary | accent | default)
function MetricCard({
  label,
  value,
  desc,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string | number;
  desc: string;
  icon: React.ElementType;
  variant: "primary" | "accent" | "default";
}) {
  const styles: Record<string, { bg: string; iconBg: string; textSub: string }> = {
    primary: { bg: "linear-gradient(135deg, hsl(285 45% 28%), hsl(285 50% 36%))", iconBg: "bg-white/15", textSub: "text-white/60" },
    accent: { bg: "linear-gradient(135deg, hsl(32 95% 46%), hsl(32 95% 54%))", iconBg: "bg-white/15", textSub: "text-white/60" },
    default: { bg: "", iconBg: "bg-primary/8", textSub: "text-muted-foreground" },
  };
  const s = styles[variant];
  const isGradient = variant !== "default";

  return (
    <div
      className={`group relative rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 ${!isGradient ? "border border-border bg-card" : "text-white"}`}
      style={{
        ...(isGradient ? { background: s.bg } : {}),
        boxShadow: isGradient
          ? "0 4px 16px hsl(285 45% 20% / 0.3), inset 0 1px 0 hsl(0 0% 100% / 0.1)"
          : "0 1px 4px hsl(285 25% 10% / 0.05), 0 4px 12px hsl(285 25% 10% / 0.04)",
      }}
      onMouseEnter={(e) => {
        if (!isGradient) e.currentTarget.style.boxShadow = "0 4px 20px hsl(285 25% 10% / 0.10), 0 1px 4px hsl(285 25% 10% / 0.06)";
      }}
      onMouseLeave={(e) => {
        if (!isGradient) e.currentTarget.style.boxShadow = "0 1px 4px hsl(285 25% 10% / 0.05), 0 4px 12px hsl(285 25% 10% / 0.04)";
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-[0.1em] ${isGradient ? "text-white/65" : "text-muted-foreground"}`}>{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
          <p className={`mt-0.5 text-xs ${s.textSub}`}>{desc}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg} ${isGradient ? "text-white" : "text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentTickets, isLoading: ticketsLoading } = useTickets({ status: "all" });

  return (
    <AppLayoutNew>
      {/* WelcomeSection — gradient background block (reference ClientDashboard) */}
      <section className="relative overflow-hidden py-8">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, hsl(285 30% 96%) 0%, hsl(30 5% 98%) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(hsl(285 45% 55% / 0.025) 1px, transparent 1px), linear-gradient(90deg, hsl(285 45% 55% / 0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute pointer-events-none" style={{ top: "-20%", right: "10%", width: 400, height: 300, background: "radial-gradient(ellipse, hsl(32 95% 52% / 0.06) 0%, transparent 70%)" }} />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">Welcome back. Here&apos;s your operations overview.</p>
            </div>
            <div
              className="flex items-center gap-4 rounded-2xl p-4"
              style={{
                background: "linear-gradient(135deg, hsl(285 25% 97%), hsl(0 0% 100%))",
                border: "1px solid hsl(270 15% 88% / 0.8)",
                boxShadow: "0 4px 16px hsl(285 25% 10% / 0.06), 0 1px 3px hsl(285 25% 10% / 0.04), inset 0 1px 0 hsl(0 0% 100% / 0.8)",
              }}
            >
              <div className="px-3 text-center">
                <div className="text-xl font-bold text-primary">{statsLoading ? "—" : stats?.totalTickets ?? 0}</div>
                <div className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">Total Tickets</div>
              </div>
              <div className="h-8 w-px" style={{ background: "hsl(270 15% 88% / 0.6)" }} />
              <div className="px-3 text-center">
                <div className="text-xl font-bold" style={{ color: "hsl(145 65% 35%)" }}>{statsLoading ? "—" : stats?.openTickets ?? 0}</div>
                <div className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">Open</div>
              </div>
              <div className="h-8 w-px" style={{ background: "hsl(270 15% 88% / 0.6)" }} />
              <div className="px-3 text-center">
                <div className="text-xl font-bold" style={{ color: "hsl(32 95% 48%)" }}>{statsLoading ? "—" : (stats?.slaBreaches ?? 0) === 0 ? "On track" : "Alert"}</div>
                <div className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">SLA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* OverviewMetrics — 4 cards in reference style */}
      <section className="pb-8">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-4 text-base font-bold text-foreground tracking-tight">Service Overview</h2>
          <div
            className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, hsl(285 15% 97%) 0%, hsl(30 5% 98%) 100%)",
              border: "1px solid hsl(270 15% 88% / 0.5)",
              boxShadow: "0 4px 24px hsl(285 25% 10% / 0.05), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total Tickets"
                value={statsLoading ? "—" : stats?.totalTickets ?? 0}
                desc="All time tickets"
                icon={Ticket}
                variant="primary"
              />
              <MetricCard
                label="Open Tickets"
                value={statsLoading ? "—" : stats?.openTickets ?? 0}
                desc="Awaiting action"
                icon={Clock}
                variant="accent"
              />
              <MetricCard
                label="Needs Review"
                value={statsLoading ? "—" : stats?.needsReviewCount ?? 0}
                desc="Manual review required"
                icon={AlertTriangle}
                variant="default"
              />
              <MetricCard
                label="SLA Breaches"
                value={statsLoading ? "—" : stats?.slaBreaches ?? 0}
                desc={stats?.slaBreaches ? "Action required" : "All on track"}
                icon={AlertCircle}
                variant="default"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Needs review info box */}
      {stats?.needsReviewCount ? (
        <>
          <GradientDivider />
          <section className="pb-6">
            <div className="mx-auto max-w-7xl px-6">
              <div
                className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up"
                style={{
                  background: "hsl(38 95% 50% / 0.08)",
                  border: "1px solid hsl(38 95% 50% / 0.25)",
                  boxShadow: "0 1px 4px hsl(285 25% 10% / 0.04)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20 shrink-0">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {stats.needsReviewCount} ticket{stats.needsReviewCount > 1 ? "s" : ""} require your attention
                    </p>
                    <p className="text-sm text-muted-foreground">Low confidence parsing detected. Please verify ticket details.</p>
                  </div>
                </div>
                <Link to="/app/review">
                  <Button className="btn-primary gap-2 shrink-0">
                    Review Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <GradientDivider />

      {/* Tickets table + right side panels (reference density) */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  border: "1px solid hsl(270 15% 88% / 0.7)",
                  boxShadow: "0 1px 4px hsl(285 25% 10% / 0.04), 0 8px 24px hsl(285 25% 10% / 0.06)",
                }}
              >
                <div
                  className="flex flex-row items-center justify-between px-5 py-4"
                  style={{ borderBottom: "1px solid hsl(270 15% 88% / 0.7)", background: "linear-gradient(135deg, hsl(285 20% 96%), hsl(270 10% 94%))" }}
                >
                  <div>
                    <h2 className="text-base font-bold text-foreground tracking-tight">Recent Tickets</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">Latest service requests</p>
                  </div>
                  <Link to="/app/tickets">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      View All
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
                <div className="bg-card">
                  <TicketsTable tickets={(recentTickets || []).slice(0, 8)} loading={ticketsLoading} compact />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Automation Health */}
              <div
                className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  border: "1px solid hsl(270 15% 88% / 0.6)",
                  boxShadow: "0 1px 4px hsl(285 25% 10% / 0.04), 0 4px 12px hsl(285 25% 10% / 0.03)",
                  background: "hsl(var(--card))",
                }}
              >
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-4">
                  <Zap className="h-4 w-4 text-accent" />
                  Automation Health
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email Processing</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-success/15 text-success border border-success/25">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Parsing Engine</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-success/15 text-success border border-success/25">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">WhatsApp Gateway</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-success/15 text-success border border-success/25">Connected</span>
                  </div>
                </div>
              </div>

              {/* Ticket Status */}
              <div
                className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  border: "1px solid hsl(270 15% 88% / 0.6)",
                  boxShadow: "0 1px 4px hsl(285 25% 10% / 0.04), 0 4px 12px hsl(285 25% 10% / 0.03)",
                  background: "hsl(var(--card))",
                }}
              >
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Ticket Status
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Open", count: stats?.openTickets ?? 0, color: "hsl(205 85% 50%)" },
                    { label: "Assigned", count: 0, color: "hsl(285 45% 50%)" },
                    { label: "In Progress", count: 0, color: "hsl(175 60% 40%)" },
                    { label: "Resolved", count: 0, color: "hsl(145 65% 35%)" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-sm text-muted-foreground flex-1">{item.label}</span>
                      <span className="text-sm font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Team */}
              <div
                className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  border: "1px solid hsl(270 15% 88% / 0.6)",
                  boxShadow: "0 1px 4px hsl(285 25% 10% / 0.04), 0 4px 12px hsl(285 25% 10% / 0.03)",
                  background: "hsl(var(--card))",
                }}
              >
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-4">
                  <Users className="h-4 w-4 text-accent" />
                  Field Team
                </h3>
                <div className="py-4 text-center">
                  <p className="text-3xl font-bold text-foreground">0</p>
                  <p className="mt-1 text-sm text-muted-foreground">Active Executives</p>
                </div>
                <Link to="/app/field-executives">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Team
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayoutNew>
  );
}
