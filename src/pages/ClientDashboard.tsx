import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  FileText,
  HelpCircle,
  Ticket,
  CheckCircle2,
  Clock,
  BarChart3,
  Download,
  X,
  ChevronRight,
  ExternalLink,
  MapPin,
  CalendarDays,
  ImageIcon,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTickets } from "@/hooks/useTickets";
import { Ticket as TicketType, TicketStatus } from "@/lib/types";
import { format } from "date-fns";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Request Received",
  NEEDS_REVIEW: "Needs Review",
  ASSIGNED: "Technician Assigned",
  EN_ROUTE: "En Route",
  ON_SITE: "Technician On-Site",
  RESOLVED_PENDING_VERIFICATION: "Under Review",
  RESOLVED: "Completed",
  REOPENED: "Reopened",
};

const STATUS_ORDER: TicketStatus[] = [
  "OPEN",
  "ASSIGNED",
  "ON_SITE",
  "RESOLVED_PENDING_VERIFICATION",
  "RESOLVED",
];

const LIFECYCLE_STEPS: { label: string; status: TicketStatus }[] = [
  { label: "Request Received", status: "OPEN" },
  { label: "Technician Assigned", status: "ASSIGNED" },
  { label: "Technician On-Site", status: "ON_SITE" },
  { label: "Under Review", status: "RESOLVED_PENDING_VERIFICATION" },
  { label: "Completed", status: "RESOLVED" },
];

const GradientDivider = () => (
  <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(285 45% 55% / 0.18), hsl(32 95% 52% / 0.10), transparent)" }} />
);

// Logo mark (no asset)
const LogoMark = ({ size = 32 }: { size?: number }) => (
  <div
    className="flex items-center justify-center rounded-xl overflow-hidden shrink-0 text-white font-bold"
    style={{
      width: size,
      height: size,
      background: "linear-gradient(145deg, hsl(285 50% 30%), hsl(285 55% 40%))",
      boxShadow: "0 0 0 1px hsl(285 45% 50% / 0.3), 0 2px 8px hsl(285 45% 20% / 0.4)",
      fontSize: size * 0.5,
    }}
  >
    S
  </div>
);

// ─── Client Header ───────────────────────────────────────────────────────────

const ClientHeader = () => {
  const { userProfile } = useAuth();
  const initials = userProfile?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "hsl(0 0% 100% / 0.82)",
        backdropFilter: "blur(20px) saturate(1.4)",
        borderBottom: "1px solid hsl(270 15% 88% / 0.7)",
        boxShadow: "0 1px 8px hsl(285 25% 10% / 0.06), 0 0 0 1px hsl(270 15% 88% / 0.3)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <div className="leading-none">
            <span className="text-sm font-bold text-foreground tracking-tight">Sahaya</span>
            <span className="ml-1.5 text-[9px] font-semibold text-muted-foreground tracking-[0.12em] uppercase">by Pariskq</span>
          </div>
        </div>
        <nav className="hidden items-center gap-0.5 md:flex">
          {[
            { label: "Dashboard", icon: LayoutDashboard, active: true, to: "/app/client" },
            { label: "Reports", icon: FileText, active: false, to: "#" },
            { label: "Support", icon: HelpCircle, active: false, to: "#" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${item.active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.active && <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, hsl(285 45% 30%), hsl(285 45% 50%))" }} />}
            </Link>
          ))}
        </nav>
        <div className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg, hsl(285 45% 28%), hsl(285 45% 38%))", boxShadow: "0 2px 8px hsl(285 45% 30% / 0.3)" }}>
          {initials}
        </div>
      </div>
    </header>
  );
};

// ─── Welcome Section ─────────────────────────────────────────────────────────

const WelcomeSection = ({ stats, loading }: { stats: { totalTickets?: number; openTickets?: number; slaBreaches?: number } | null; loading: boolean }) => (
  <section className="relative overflow-hidden py-8">
    <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, hsl(285 30% 96%) 0%, hsl(30 5% 98%) 100%)" }} />
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(hsl(285 45% 55% / 0.025) 1px, transparent 1px), linear-gradient(90deg, hsl(285 45% 55% / 0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
    <div className="absolute pointer-events-none" style={{ top: "-20%", right: "10%", width: 400, height: 300, background: "radial-gradient(ellipse, hsl(32 95% 52% / 0.06) 0%, transparent 70%)" }} />

    <div className="relative z-10 mx-auto max-w-7xl px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your service requests with full transparency and SLA visibility.</p>
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
            <div className="text-xl font-bold" style={{ color: "hsl(285 45% 30%)" }}>{loading ? "—" : stats?.openTickets ?? 0}</div>
            <div className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">Active Tickets</div>
          </div>
          <div className="h-8 w-px" style={{ background: "hsl(270 15% 88% / 0.6)" }} />
          <div className="px-3 text-center">
            <div className="text-xl font-bold" style={{ color: "hsl(145 65% 35%)" }}>{loading ? "—" : (stats?.totalTickets ?? 0) - (stats?.openTickets ?? 0)}</div>
            <div className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">Resolved</div>
          </div>
          <div className="h-8 w-px" style={{ background: "hsl(270 15% 88% / 0.6)" }} />
          <div className="px-3 text-center">
            <div className="text-xl font-bold" style={{ color: "hsl(32 95% 48%)" }}>{(stats?.slaBreaches ?? 0) === 0 ? "On track" : "Alert"}</div>
            <div className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">SLA</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Overview Metrics ────────────────────────────────────────────────────────

function MetricCard({ label, value, desc, icon: Icon, variant }: { label: string; value: string | number; desc: string; icon: React.ElementType; variant: "primary" | "accent" | "default" }) {
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
        boxShadow: isGradient ? "0 4px 16px hsl(285 45% 20% / 0.3), inset 0 1px 0 hsl(0 0% 100% / 0.1)" : "0 1px 4px hsl(285 25% 10% / 0.05), 0 4px 12px hsl(285 25% 10% / 0.04)",
      }}
      onMouseEnter={(e) => { if (!isGradient) e.currentTarget.style.boxShadow = "0 4px 20px hsl(285 25% 10% / 0.10), 0 1px 4px hsl(285 25% 10% / 0.06)"; }}
      onMouseLeave={(e) => { if (!isGradient) e.currentTarget.style.boxShadow = "0 1px 4px hsl(285 25% 10% / 0.05), 0 4px 12px hsl(285 25% 10% / 0.04)"; }}
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

// ─── Status badge (client-facing labels) ───────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/12 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {STATUS_LABELS[status] ?? status}
  </span>
);

const SlaBadge = ({ onTrack }: { onTrack: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${onTrack ? "border-success/25 bg-success/12 text-success" : "border-destructive/25 bg-destructive/12 text-destructive"}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {onTrack ? "On Track" : "Breached"}
  </span>
);

// ─── Tickets Table (client list) ─────────────────────────────────────────────

const ClientTicketsTable = ({ tickets, loading, onSelect }: { tickets: TicketType[]; loading: boolean; onSelect: (t: TicketType) => void }) => (
  <section className="py-10">
    <div className="mx-auto max-w-7xl px-6">
      <h2 className="mb-4 text-base font-bold text-foreground tracking-tight">Your Service Requests</h2>
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid hsl(270 15% 88% / 0.7)", boxShadow: "0 1px 4px hsl(285 25% 10% / 0.04), 0 8px 24px hsl(285 25% 10% / 0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "linear-gradient(135deg, hsl(285 20% 96%), hsl(270 10% 94%))", borderBottom: "1px solid hsl(270 15% 88% / 0.7)" }}>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Ticket ID</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Summary</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Last Updated</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">Loading...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">No tickets yet.</td>
                </tr>
              ) : (
                tickets.map((ticket, i) => (
                  <tr
                    key={ticket.id}
                    className="group transition-all duration-150 cursor-pointer"
                    style={{
                      background: i % 2 === 1 ? "hsl(270 10% 94% / 0.15)" : "hsl(0 0% 100%)",
                      borderBottom: i < tickets.length - 1 ? "1px solid hsl(270 15% 88% / 0.4)" : "none",
                    }}
                    onClick={() => onSelect(ticket)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(285 20% 96% / 0.6)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 1 ? "hsl(270 10% 94% / 0.15)" : "hsl(0 0% 100%)"; }}
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-medium text-foreground">{ticket.ticket_number}</td>
                    <td className="max-w-xs truncate px-5 py-3 text-foreground">{ticket.issue_type || ticket.category || ticket.ticket_number}</td>
                    <td className="px-5 py-3"><StatusBadge status={ticket.status} /></td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{format(new Date(ticket.updated_at), "yyyy-MM-dd")}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/app/tickets/${ticket.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/6">
                        Details <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
);

// ─── Ticket Detail Drawer ─────────────────────────────────────────────────────

const TicketDetailDrawer = ({ ticket, onClose }: { ticket: TicketType | null; onClose: () => void }) => {
  if (!ticket) return null;
  const currentIdx = STATUS_ORDER.indexOf(ticket.status);

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} style={{ background: "hsl(285 45% 10% / 0.4)", backdropFilter: "blur(6px)" }} />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, hsl(0 0% 100%), hsl(285 10% 98%))",
          boxShadow: "-8px 0 40px hsl(285 45% 10% / 0.15), -1px 0 0 hsl(270 15% 88% / 0.5)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid hsl(270 15% 88% / 0.6)", background: "linear-gradient(135deg, hsl(285 20% 97%), hsl(0 0% 100%))" }}>
          <div>
            <p className="font-mono text-xs font-medium text-muted-foreground">{ticket.ticket_number}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge status={ticket.status} />
              <SlaBadge onTrack={true} />
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-muted/50 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 p-6">
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">{ticket.issue_type || ticket.category || ticket.ticket_number}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ticket.category && ticket.issue_type ? `${ticket.category} · ${ticket.issue_type}` : "Service request"}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {ticket.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{ticket.location}</span>}
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />Created {format(new Date(ticket.opened_at), "yyyy-MM-dd")}</span>
            </div>
          </div>

          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(285 45% 55% / 0.15), transparent)" }} />

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Lifecycle Progress</h4>
            <div className="space-y-0">
              {LIFECYCLE_STEPS.map((step, i) => {
                const stepIdx = STATUS_ORDER.indexOf(step.status);
                const isComplete = stepIdx < currentIdx;
                const isCurrent = stepIdx === currentIdx;
                const isPending = stepIdx > currentIdx;
                return (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                        style={
                          isComplete ? { background: "hsl(145 65% 35%)", color: "white", boxShadow: "0 0 8px hsl(145 65% 35% / 0.3)" }
                          : isCurrent ? { background: "linear-gradient(135deg, hsl(285 45% 30%), hsl(285 45% 40%))", color: "white", boxShadow: "0 0 12px hsl(285 45% 40% / 0.4)" }
                          : { background: "hsl(270 10% 94%)", color: "hsl(270 10% 45%)", border: "1px solid hsl(270 15% 88%)" }
                        }
                      >
                        {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      {i < LIFECYCLE_STEPS.length - 1 && <div className="w-px flex-1 min-h-[18px]" style={{ background: isComplete ? "hsl(145 65% 35% / 0.4)" : "hsl(270 15% 88%)" }} />}
                    </div>
                    <div className={`pb-3.5 ${isPending ? "opacity-35" : ""}`}>
                      <p className={`text-sm font-medium ${isCurrent ? "text-primary" : "text-foreground"}`}>{step.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {ticket.status === "RESOLVED" && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Resolution Proof</h4>
              <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: "hsl(145 65% 35% / 0.06)", border: "1px solid hsl(145 65% 35% / 0.18)" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/12">
                  <ImageIcon className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Resolution Verified</p>
                  <p className="text-xs text-muted-foreground">Evidence submitted and validated</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6" style={{ borderTop: "1px solid hsl(270 15% 88% / 0.6)" }}>
          <Link
            to={`/app/tickets/${ticket.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px"
            style={{ background: "linear-gradient(135deg, hsl(32 95% 46%), hsl(32 95% 54%))", boxShadow: "0 2px 12px hsl(32 95% 52% / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.15)" }}
          >
            <Download className="h-4 w-4" />
            View Full Details
          </Link>
        </div>
      </div>
    </>
  );
};

// ─── Reports Section ─────────────────────────────────────────────────────────

const REPORTS = [
  { title: "Ticket Summary (CSV)", desc: "Export all service requests with status and SLA data.", icon: FileText },
  { title: "Monthly SLA Report", desc: "Phase-based SLA compliance summary for management review.", icon: BarChart3 },
  { title: "Resolution Report", desc: "Detailed resolution records with proof and timelines.", icon: CheckCircle2 },
];

const ReportsSection = () => (
  <section className="relative py-10 overflow-hidden">
    <div className="relative z-10 mx-auto max-w-7xl px-6">
      <h2 className="mb-4 text-base font-bold text-foreground tracking-tight">Reports & Documentation</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {REPORTS.map((r) => (
          <div
            key={r.title}
            className="group flex flex-col rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(270 15% 88% / 0.7)", boxShadow: "0 1px 4px hsl(285 25% 10% / 0.04), 0 4px 12px hsl(285 25% 10% / 0.03)" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px hsl(285 25% 10% / 0.08), 0 1px 4px hsl(285 25% 10% / 0.04)"; e.currentTarget.style.borderColor = "hsl(285 45% 60% / 0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px hsl(285 25% 10% / 0.04), 0 4px 12px hsl(285 25% 10% / 0.03)"; e.currentTarget.style.borderColor = "hsl(270 15% 88% / 0.7)"; }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-primary" style={{ background: "hsl(285 45% 30% / 0.06)" }}>
              <r.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">{r.title}</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"> <Download className="h-3.5 w-3.5" /> Download </span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Support Section ─────────────────────────────────────────────────────────

const SupportSection = () => (
  <section className="py-8">
    <div className="mx-auto max-w-7xl px-6">
      <div
        className="rounded-2xl p-6 md:flex md:items-center md:justify-between"
        style={{
          background: "linear-gradient(135deg, hsl(285 20% 97%), hsl(0 0% 100%))",
          border: "1px solid hsl(270 15% 88% / 0.7)",
          boxShadow: "0 1px 4px hsl(285 25% 10% / 0.04), 0 4px 16px hsl(285 25% 10% / 0.04), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
        }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl text-primary shrink-0" style={{ background: "hsl(285 45% 30% / 0.06)" }}>
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Need Assistance?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">If you have questions regarding your service requests or SLA performance, contact our support team.</p>
          </div>
        </div>
        <a href="mailto:support@pariskq.com" className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-px md:mt-0" style={{ border: "1px solid hsl(270 15% 88%)", boxShadow: "0 1px 3px hsl(285 25% 10% / 0.04)" }}>
          <ExternalLink className="h-4 w-4" />
          Contact Support
        </a>
      </div>
    </div>
  </section>
);

// ─── Footer ──────────────────────────────────────────────────────────────────

const DashboardFooter = () => (
  <footer className="py-5" style={{ borderTop: "1px solid hsl(270 15% 88% / 0.5)" }}>
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 text-xs text-muted-foreground sm:flex-row">
      <span>© 2026 Pariskq. All rights reserved.</span>
      <span className="font-medium" style={{ letterSpacing: "0.08em" }}>Precision Meets Perfection</span>
    </div>
  </footer>
);

// ─── Main ────────────────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets({ status: "all" });

  return (
    <div className="min-h-screen" style={{ background: "hsl(30 5% 98%)" }}>
      <ClientHeader />
      <main className="pt-14">
        <WelcomeSection stats={stats} loading={statsLoading} />
        <GradientDivider />
        <section className="pb-8">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-4 text-base font-bold text-foreground tracking-tight">Service Overview</h2>
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, hsl(285 15% 97%) 0%, hsl(30 5% 98%) 100%)", border: "1px solid hsl(270 15% 88% / 0.5)", boxShadow: "0 4px 24px hsl(285 25% 10% / 0.05), inset 0 1px 0 hsl(0 0% 100% / 0.7)" }}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Active Tickets" value={statsLoading ? "—" : stats?.openTickets ?? 0} desc="Currently in progress" icon={Ticket} variant="primary" />
                <MetricCard label="Resolved" value={statsLoading ? "—" : (stats?.totalTickets ?? 0) - (stats?.openTickets ?? 0)} desc="Successfully completed" icon={CheckCircle2} variant="default" />
                <MetricCard label="SLA Compliance" value={(stats?.slaBreaches ?? 0) === 0 ? "On track" : "Alert"} desc="Phase-based tracking" icon={Clock} variant="accent" />
                <MetricCard label="Total Requests" value={statsLoading ? "—" : stats?.totalTickets ?? 0} desc="All time" icon={BarChart3} variant="default" />
              </div>
            </div>
          </div>
        </section>
        <GradientDivider />
        <ClientTicketsTable tickets={tickets} loading={ticketsLoading} onSelect={setSelectedTicket} />
        <GradientDivider />
        <ReportsSection />
        <GradientDivider />
        <SupportSection />
      </main>
      <DashboardFooter />
      <TicketDetailDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
