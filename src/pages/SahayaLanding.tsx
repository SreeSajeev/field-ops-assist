import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  Mail,
  Clock,
  FileText,
  BarChart3,
  Users,
  MapPin,
  Lock,
  Layers,
  ChevronRight,
  Menu,
  X,
  Zap,
  AlertCircle,
  Ticket,
  Activity,
  Database,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const steps = [
  { number: 1, title: "Ingest", description: "Every inbound service email is automatically captured and logged into the system.", icon: <Mail className="h-4 w-4" /> },
  { number: 2, title: "Parse", description: "Structured data such as complaint ID, vehicle details, issue type, location, and remarks are extracted.", icon: <FileText className="h-4 w-4" /> },
  { number: 3, title: "Validate", description: "Required-field validation and confidence scoring determine whether the ticket is marked OPEN or NEEDS REVIEW.", icon: <AlertCircle className="h-4 w-4" /> },
  { number: 4, title: "Create Ticket", description: "A unique ticket number is generated, establishing a single source of truth for the request.", icon: <Ticket className="h-4 w-4" /> },
  { number: 5, title: "Notify", description: "The requester receives confirmation, including missing detail prompts when necessary.", icon: <Mail className="h-4 w-4" /> },
  { number: 6, title: "Assign", description: "Staff assigns a Field Executive, and the assignment is logged in the audit trail.", icon: <Users className="h-4 w-4" /> },
  { number: 7, title: "On-Site Token", description: "A time-bound token is generated to verify physical presence at the service location.", icon: <MapPin className="h-4 w-4" /> },
  { number: 8, title: "Resolution Proof", description: "The Field Executive submits resolution evidence, transitioning the ticket to RESOLVED PENDING VERIFICATION.", icon: <CheckCircle2 className="h-4 w-4" /> },
  { number: 9, title: "Verify and Close", description: "Operations staff verifies the resolution and closes the ticket, notifying the customer.", icon: <Shield className="h-4 w-4" /> },
  { number: 10, title: "Audit", description: "Every state transition, assignment, comment, and proof submission is permanently logged.", icon: <Database className="h-4 w-4" /> },
];

const modules = [
  { title: "Ticket Intelligence Engine", description: "Email-to-ticket automation that converts unstructured inbound communication into structured, validated, lifecycle-managed service records.", capabilities: ["Automatic email ingestion", "Structured data parsing", "Validation and confidence scoring", "OPEN / NEEDS REVIEW workflow control", "End-to-end lifecycle tracking"], icon: <Zap className="h-5 w-5" />, accentIdx: 0 },
  { title: "SLA Intelligence Dashboard", description: "Three-phase SLA tracking system covering Assignment, On-Site, and Resolution performance.", capabilities: ["Real-time deadline tracking", "Breach detection", "Compliance percentage metrics", "Phase-based SLA visibility", "Exportable reporting"], icon: <BarChart3 className="h-5 w-5" />, accentIdx: 1 },
  { title: "Field Executive Control", description: "Token-based verification system that ensures physical presence and resolution authenticity.", capabilities: ["Time-bound secure tokens", "On-site confirmation", "Resolution proof submission", "Reassignment handling", "Field Executive-specific ticket interface"], icon: <MapPin className="h-5 w-5" />, accentIdx: 2 },
  { title: "Communication Automation", description: "Structured notification system ensuring stakeholders remain informed throughout the ticket lifecycle.", capabilities: ["Confirmation emails", "Missing detail requests", "Assignment notifications", "Resolution confirmations", "Event logging"], icon: <Mail className="h-5 w-5" />, accentIdx: 0 },
  { title: "Audit & Compliance Layer", description: "Permanent, structured logging system ensuring operational traceability and compliance readiness.", capabilities: ["State change history", "Assignment logs", "Comment tracking", "Proof record retention", "Exportable audit trails"], icon: <FileText className="h-5 w-5" />, accentIdx: 1 },
  { title: "Multi-Tenant SaaS Architecture", description: "Enterprise-ready foundation supporting organization-based role segmentation.", capabilities: ["Super Admin (global visibility)", "Organization Admin", "Staff role control", "Field Executive role control", "Data isolation framework"], icon: <Layers className="h-5 w-5" />, accentIdx: 2 },
];

const enterpriseFeatures = [
  { title: "Role-Based Access Control", description: "Granular role segmentation ensures appropriate operational visibility across teams.", icon: <Lock className="h-4 w-4" /> },
  { title: "SLA Configuration", description: "Organizations can define service-level expectations aligned with operational priorities.", icon: <Clock className="h-4 w-4" /> },
  { title: "Performance Analytics", description: "Operational metrics provide clarity into resolution performance and SLA adherence.", icon: <Activity className="h-4 w-4" /> },
  { title: "CSV Export", description: "Structured reporting for management review and compliance submission.", icon: <FileText className="h-4 w-4" /> },
  { title: "Audit Trails", description: "Immutable operational logs for governance and traceability.", icon: <Database className="h-4 w-4" /> },
  { title: "Secure Authentication", description: "Token-based authentication with protected role-level access.", icon: <Shield className="h-4 w-4" /> },
  { title: "Scalable Architecture", description: "Built to support expanding teams, growing ticket volume, and multi-organization deployments.", icon: <Layers className="h-4 w-4" /> },
];

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

const LogoMark = ({ size = 38 }: { size?: number }) => (
  <div
    className="flex items-center justify-center rounded-xl overflow-hidden shrink-0 text-white font-bold"
    style={{
      width: size,
      height: size,
      background: "linear-gradient(145deg, hsl(285 50% 30%), hsl(285 55% 40%))",
      boxShadow: "0 0 0 1px hsl(285 45% 50% / 0.3), 0 2px 8px hsl(285 45% 20% / 0.5)",
      fontSize: size * 0.5,
    }}
  >
    S
  </div>
);

const SectionLabel = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <span
    className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.12em] mb-4"
    style={dark ? { background: "hsl(32 95% 52% / 0.12)", color: "hsl(32 95% 68%)", border: "1px solid hsl(32 95% 52% / 0.25)" } : { background: "hsl(var(--primary) / 0.07)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.18)" }}
  >
    <span className="h-1 w-1 rounded-full inline-block" style={{ background: dark ? "hsl(32 95% 68%)" : "hsl(var(--primary))" }} />
    {children}
  </span>
);

const PrimaryButton = ({ children, className = "", onClick, style: styleProp, asLink, to }: { children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties; asLink?: boolean; to?: string }) => {
  const style = {
    background: "linear-gradient(135deg, hsl(32 95% 46%), hsl(32 95% 54%))",
    boxShadow: "0 2px 12px hsl(32 95% 52% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
    padding: "10px 22px",
    ...styleProp,
  };
  const classNameStr = `inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-1 ${className}`;
  if (asLink && to) {
    return (
      <Link
        to={to}
        className={classNameStr}
        style={style}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px hsl(32 95% 52% / 0.55), inset 0 1px 0 hsl(0 0% 100% / 0.15)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 12px hsl(32 95% 52% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.15)"; }}
      >
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classNameStr} style={style} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px hsl(32 95% 52% / 0.55), inset 0 1px 0 hsl(0 0% 100% / 0.15)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px hsl(32 95% 52% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.15)"; }}>
      {children}
    </button>
  );
};

const OutlineButton = ({ children, className = "", dark = false, onClick }: { children: React.ReactNode; className?: string; dark?: boolean; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-px active:translate-y-0 focus:outline-none ${dark ? "text-white/80 hover:text-white hover:bg-white/8" : "text-foreground hover:bg-muted/60"} ${className}`}
    style={{ border: dark ? "1px solid hsl(0 0% 100% / 0.18)" : "1px solid hsl(var(--border))", padding: "10px 22px" }}
  >
    {children}
  </button>
);

const GradientDivider = ({ flip = false }: { flip?: boolean }) => (
  <div className="h-px w-full" style={{ background: flip ? "linear-gradient(90deg, transparent, hsl(285 45% 55% / 0.2), hsl(32 95% 52% / 0.15), transparent)" : "linear-gradient(90deg, transparent, hsl(285 45% 55% / 0.15), transparent)" }} />
);

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navLinks = ["About", "Integrity Chain", "Modules", "Enterprise", "Pricing", "Documentation"];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={scrolled ? { background: "hsl(285 45% 13% / 0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid hsl(285 35% 22% / 0.8)", boxShadow: "0 4px 24px hsl(285 45% 10% / 0.5)" } : { background: "transparent" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-white tracking-tight">Sahaya</span>
            <span className="text-[9px] font-semibold text-white/45 tracking-[0.16em] uppercase">by Pariskq</span>
          </div>
        </a>

        <nav className="hidden lg:flex items-center">
          {navLinks.map((link) => (
            <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`} className="px-3.5 py-1.5 text-[13px] font-medium text-white/60 hover:text-white/90 transition-colors duration-150">
              {link}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center">
          <PrimaryButton asLink to="/login" className="text-[13px]" style={{ padding: "8px 18px" }}>
            Login to Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </PrimaryButton>
        </div>

        <button type="button" className="lg:hidden p-2 text-white/70 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ background: "hsl(285 45% 12% / 0.97)", borderTop: "1px solid hsl(285 35% 22% / 0.5)" }}>
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`} className="px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all" onClick={() => setMobileOpen(false)}>
                {link}
              </a>
            ))}
            <div className="pt-3 mt-1 border-t border-white/8">
              <PrimaryButton asLink to="/login" className="w-full justify-center">
                Login to Dashboard <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden flex flex-col justify-center"
      style={{ minHeight: "100vh", background: "linear-gradient(150deg, hsl(285 50% 10%) 0%, hsl(285 45% 16%) 50%, hsl(285 40% 12%) 100%)" }}
      id="about"
    >
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(hsl(285 45% 55% / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(285 45% 55% / 0.04) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
      <div className="absolute pointer-events-none" style={{ top: "15%", right: "8%", width: 480, height: 480, background: "radial-gradient(ellipse, hsl(32 95% 52% / 0.10) 0%, transparent 65%)", filter: "blur(1px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "10%", left: "5%", width: 360, height: 360, background: "radial-gradient(ellipse, hsl(285 55% 55% / 0.10) 0%, transparent 65%)" }} />
      <div className="absolute pointer-events-none" style={{ top: "40%", left: "40%", width: 600, height: 400, background: "radial-gradient(ellipse, hsl(285 45% 45% / 0.06) 0%, transparent 70%)" }} />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 relative z-10 w-full">
        <div className="grid lg:grid-cols-[1fr_420px] gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md mb-7 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ background: "hsl(32 95% 52% / 0.10)", border: "1px solid hsl(32 95% 52% / 0.28)", color: "hsl(32 95% 68%)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse inline-block" />
              Enterprise Field Operations Platform
            </div>
            <h1 className="font-bold leading-[1.08] tracking-tight mb-2" style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}>
              <span style={{ background: "linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(285 30% 88%) 55%, hsl(32 95% 80%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Sahaya
              </span>
            </h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/30 mb-5">by Pariskq</p>
            <p className="text-xl sm:text-2xl font-semibold mb-5 leading-snug" style={{ color: "hsl(0 0% 88%)" }}>
              Intelligent Field Operations.<br className="hidden sm:block" /> Verified Outcomes.
            </p>
            <p className="text-[15px] leading-[1.7] mb-8 max-w-xl" style={{ color: "hsl(285 15% 68%)" }}>
              Sahaya transforms inbound service emails into structured, SLA-tracked, and auditable workflows with proof at every step of the lifecycle. From ticket creation to on-site verification and final closure, every action is traceable, accountable, and measurable. No dropped tickets. No unverified resolutions. No operational blind spots.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <PrimaryButton asLink to="/login">Login to Dashboard <ArrowRight className="h-4 w-4" /></PrimaryButton>
              <OutlineButton dark>Request Demo</OutlineButton>
            </div>
            <div className="flex flex-wrap gap-5 pt-6" style={{ borderTop: "1px solid hsl(285 35% 30% / 0.5)" }}>
              {["100% Structured Workflows", "Real-Time SLA Tracking", "Audit-Ready Traceability"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[13px]" style={{ color: "hsl(285 15% 58%)" }}>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(32 95% 60%)" }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(145deg, hsl(285 40% 18%), hsl(285 45% 14%))", border: "1px solid hsl(285 40% 30% / 0.5)", boxShadow: "0 0 0 1px hsl(285 45% 40% / 0.1), 0 20px 60px hsl(285 45% 10% / 0.8), inset 0 1px 0 hsl(0 0% 100% / 0.06)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid hsl(285 35% 25% / 0.7)", background: "hsl(285 45% 15%)" }}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(0 72% 51% / 0.7)" }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(38 95% 50% / 0.7)" }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(145 65% 40% / 0.7)" }} />
                  </div>
                  <span className="text-[11px] font-mono text-white/30 ml-2">Ticket Lifecycle — Active View</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: "hsl(32 95% 60%)" }}>● LIVE</span>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { id: "TKT-2841", status: "OPEN", sla: "4h 12m", label: "hsl(205 85% 55%)" },
                  { id: "TKT-2840", status: "ON SITE", sla: "0h 47m", label: "hsl(145 65% 45%)" },
                  { id: "TKT-2839", status: "ASSIGNED", sla: "2h 05m", label: "hsl(285 45% 60%)" },
                  { id: "TKT-2838", status: "RESOLVED", sla: "Closed", label: "hsl(145 65% 38%)" },
                  { id: "TKT-2837", status: "NEEDS REVIEW", sla: "SLA Breach", label: "hsl(0 72% 55%)" },
                ].map((row, i) => (
                  <div key={row.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: i === 0 ? "hsl(285 45% 22% / 0.8)" : "hsl(285 40% 18% / 0.5)", border: i === 0 ? "1px solid hsl(285 45% 38% / 0.5)" : "1px solid hsl(285 35% 25% / 0.4)" }}>
                    <span className="text-[10px] font-mono text-white/35 shrink-0 w-16">{row.id}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide shrink-0" style={{ background: `${row.label}18`, color: row.label, border: `1px solid ${row.label}30` }}>{row.status}</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "hsl(285 35% 22%)" }}>
                      <div className="h-full rounded-full" style={{ width: i === 3 ? "100%" : i === 4 ? "95%" : `${30 + i * 18}%`, background: row.label }} />
                    </div>
                    <span className="text-[10px] font-mono shrink-0" style={{ color: row.sla === "SLA Breach" ? "hsl(0 72% 60%)" : "hsl(285 15% 55%)" }}>{row.sla}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid hsl(285 35% 25% / 0.5)", background: "hsl(285 45% 12%)" }}>
                <span className="text-[10px] font-mono" style={{ color: "hsl(285 15% 45%)" }}>5 active tickets · 2 SLA critical</span>
                <span className="text-[10px]" style={{ color: "hsl(32 95% 60%)" }}>View All →</span>
              </div>
              <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, hsl(32 95% 52% / 0.08), transparent 70%)" }} />
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-2.5 rounded-xl flex items-center gap-2.5" style={{ background: "hsl(285 45% 18%)", border: "1px solid hsl(285 40% 30% / 0.6)", boxShadow: "0 8px 24px hsl(285 45% 10% / 0.6)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(145 65% 30%), hsl(145 65% 38%))" }}>
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-medium">SLA Compliance</p>
                <p className="text-sm font-bold text-white leading-tight">98.4%</p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 px-4 py-2.5 rounded-xl flex items-center gap-2.5" style={{ background: "hsl(285 45% 18%)", border: "1px solid hsl(285 40% 30% / 0.6)", boxShadow: "0 8px 24px hsl(285 45% 10% / 0.6)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(285 45% 28%), hsl(285 50% 38%))" }}>
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-medium">Audit Events</p>
                <p className="text-sm font-bold text-white leading-tight">100% Logged</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, hsl(285 45% 10%))" }} />
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsSection() {
  const stats = [
    { label: "Tickets Processed", highlight: "100% Structured", sub: "Workflow Coverage", icon: <Ticket className="h-5 w-5" />, variant: "primary" as const },
    { label: "SLA Compliance", highlight: "Real-Time", sub: "Phase Tracking", icon: <Clock className="h-5 w-5" />, variant: "accent" as const },
    { label: "Resolution Time", highlight: "Measured", sub: "and Auditable", icon: <BarChart3 className="h-5 w-5" />, variant: "default" as const },
    { label: "Audit Events", highlight: "Complete", sub: "Chain of Custody", icon: <Database className="h-5 w-5" />, variant: "default" as const },
  ];

  return (
    <section style={{ background: "hsl(285 45% 10%)" }}>
      <GradientDivider />
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">Operational Confidence at Scale</h2>
            <p className="text-[13px] mt-1" style={{ color: "hsl(285 15% 55%)" }}>Every metric is a commitment to disciplined, measurable service delivery.</p>
          </div>
          <div className="shrink-0 text-[11px] font-mono px-3 py-1.5 rounded-md" style={{ background: "hsl(285 40% 16%)", border: "1px solid hsl(285 35% 25%)", color: "hsl(32 95% 60%)" }}>
            ● Real-time data
          </div>
        </div>
        <div className="rounded-2xl p-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "hsl(285 40% 22%)", boxShadow: "0 0 0 1px hsl(285 40% 22%)" }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative p-5 rounded-xl overflow-hidden transition-all duration-200 cursor-default"
              style={{
                background: stat.variant === "primary" ? "linear-gradient(145deg, hsl(285 50% 20%), hsl(285 45% 26%))" : stat.variant === "accent" ? "linear-gradient(145deg, hsl(285 45% 17%), hsl(285 40% 22%))" : "hsl(285 40% 14%)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = stat.variant === "default" ? "hsl(285 40% 17%)" : ""; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = stat.variant === "default" ? "hsl(285 40% 14%)" : ""; }}
            >
              {stat.variant !== "default" && <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, hsl(32 95% 52% / 0.12), transparent 70%)" }} />}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: stat.variant === "primary" ? "hsl(0 0% 100% / 0.12)" : stat.variant === "accent" ? "hsl(32 95% 52% / 0.15)" : "hsl(285 40% 22%)", color: stat.variant === "primary" ? "hsl(32 95% 72%)" : stat.variant === "accent" ? "hsl(32 95% 68%)" : "hsl(285 30% 60%)" }}>
                  {stat.icon}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "hsl(285 15% 52%)" }}>{stat.label}</p>
              </div>
              <p className="text-xl font-bold leading-tight text-white">{stat.highlight}</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(285 15% 55%)" }}>{stat.sub}</p>
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px hsl(32 95% 52% / 0.2)" }} />
            </div>
          ))}
        </div>
      </div>
      <GradientDivider flip />
    </section>
  );
}

// ─── Integrity Chain ──────────────────────────────────────────────────────────

function IntegrityChainSection() {
  return (
    <section className="relative py-16 overflow-hidden" id="integrity-chain" style={{ background: "hsl(30 5% 98%)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(hsl(285 45% 45% / 0.035) 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-2xl mb-10">
          <SectionLabel>Process Architecture</SectionLabel>
          <h2 className="text-3xl font-bold text-foreground mb-3 leading-tight">The 10-Step Integrity Chain</h2>
          <p className="text-[14px] leading-relaxed text-muted-foreground">Every service request in Sahaya follows a structured chain of custody that ensures operational discipline and complete traceability.</p>
        </div>
        <div className="space-y-3">
          {[steps.slice(0, 5), steps.slice(5, 10)].map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {row.map((step, colIdx) => {
                const isAccent = step.number % 2 === 0;
                return (
                  <div
                    key={step.number}
                    className="group relative p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 1px 4px hsl(285 25% 10% / 0.06)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px hsl(285 25% 10% / 0.1), 0 0 0 1px hsl(285 45% 45% / 0.15)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px hsl(285 25% 10% / 0.06)"; }}
                  >
                    {colIdx < 4 && <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-20 items-center justify-center w-6"><ChevronRight className="h-3 w-3" style={{ color: "hsl(285 30% 70%)" }} /></div>}
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0" style={{ background: isAccent ? "linear-gradient(135deg, hsl(32 95% 44%), hsl(32 95% 52%))" : "linear-gradient(135deg, hsl(285 45% 28%), hsl(285 50% 36%))", color: "white", boxShadow: isAccent ? "0 2px 6px hsl(32 95% 52% / 0.35)" : "0 2px 6px hsl(285 45% 30% / 0.35)" }}>
                        {step.number}
                      </div>
                      <div style={{ color: "hsl(var(--primary))", opacity: 0.6 }}>{step.icon}</div>
                    </div>
                    <h3 className="text-[13px] font-semibold text-foreground mb-1 leading-tight">{step.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{step.description}</p>
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "linear-gradient(145deg, hsl(285 45% 45% / 0.03), transparent)" }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Modules ──────────────────────────────────────────────────────────────────

const MODULE_ACCENTS = [
  { iconBg: "linear-gradient(135deg, hsl(285 45% 28%), hsl(285 50% 38%))", iconShadow: "0 4px 10px hsl(285 45% 30% / 0.4)", borderHover: "hsl(285 45% 45% / 0.3)" },
  { iconBg: "linear-gradient(135deg, hsl(32 95% 44%), hsl(32 95% 54%))", iconShadow: "0 4px 10px hsl(32 95% 52% / 0.35)", borderHover: "hsl(32 95% 52% / 0.25)" },
  { iconBg: "linear-gradient(135deg, hsl(285 40% 36%), hsl(285 45% 44%))", iconShadow: "0 4px 10px hsl(285 40% 36% / 0.35)", borderHover: "hsl(285 40% 50% / 0.25)" },
];

function ModulesSection() {
  return (
    <section className="py-16 relative" id="modules" style={{ background: "linear-gradient(180deg, hsl(285 20% 96%) 0%, hsl(30 5% 98%) 100%)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <SectionLabel>Platform Modules</SectionLabel>
            <h2 className="text-3xl font-bold text-foreground leading-tight">Core Product Modules</h2>
            <p className="text-[14px] mt-1.5 text-muted-foreground max-w-lg">Purpose-built components working in concert to deliver structured, end-to-end service operations.</p>
          </div>
          <div className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
            6 Integrated Modules
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const accent = MODULE_ACCENTS[mod.accentIdx];
            return (
              <div
                key={mod.title}
                className="group relative p-5 rounded-xl flex flex-col transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 1px 4px hsl(285 25% 10% / 0.06)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 20px hsl(285 25% 10% / 0.1), 0 0 0 1px ${accent.borderHover}`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px hsl(285 25% 10% / 0.06)"; }}
              >
                <div className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(90deg, transparent, ${accent.borderHover}, transparent)` }} />
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105" style={{ background: accent.iconBg, color: "white", boxShadow: accent.iconShadow }}>
                    {mod.icon}
                  </div>
                  <div className="pt-0.5">
                    <h3 className="text-[15px] font-bold text-foreground leading-tight">{mod.title}</h3>
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{mod.description}</p>
                <div className="mt-auto pt-4" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground/70 mb-2.5">Capabilities</p>
                  <ul className="space-y-1.5">
                    {mod.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-2 text-[12px]" style={{ color: "hsl(var(--foreground) / 0.75)" }}>
                        <span className="h-1 w-1 rounded-full shrink-0" style={{ background: "hsl(32 95% 52%)" }} />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Enterprise ───────────────────────────────────────────────────────────────

function EnterpriseSection() {
  return (
    <section className="py-16 relative overflow-hidden" id="enterprise" style={{ background: "linear-gradient(160deg, hsl(285 50% 11%), hsl(285 45% 15%), hsl(285 40% 13%))" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(hsl(285 45% 55% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(285 45% 55% / 0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute pointer-events-none" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: "radial-gradient(ellipse, hsl(32 95% 52% / 0.05) 0%, transparent 60%)" }} />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-2xl mb-10">
          <SectionLabel dark>Enterprise Grade</SectionLabel>
          <h2 className="text-3xl font-bold text-white leading-tight mb-2">Enterprise-Ready by Design</h2>
          <p className="text-[14px] leading-relaxed" style={{ color: "hsl(285 15% 55%)" }}>Infrastructure-grade capabilities for organizations that demand accountability at every layer.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {enterpriseFeatures.map((feat, i) => (
            <div
              key={feat.title}
              className="group relative p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "hsl(285 40% 16% / 0.6)", border: "1px solid hsl(285 35% 26% / 0.7)", backdropFilter: "blur(8px)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "hsl(285 40% 19% / 0.8)"; (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(285 40% 35% / 0.6)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "hsl(285 40% 16% / 0.6)"; (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(285 35% 26% / 0.7)"; }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(285 45% 26%)", color: "hsl(285 30% 72%)", border: "1px solid hsl(285 40% 32%)" }}>
                  {feat.icon}
                </div>
                <h3 className="text-[13px] font-semibold text-white leading-tight">{feat.title}</h3>
              </div>
              <p className="text-[12px] leading-relaxed pl-11" style={{ color: "hsl(285 15% 52%)" }}>{feat.description}</p>
              <span className="absolute top-3 right-3 text-[9px] font-mono" style={{ color: "hsl(285 30% 40%)" }}>0{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection() {
  const plans = [
    { name: "Standard", description: "Designed for single-organization deployments requiring structured ticket lifecycle management and SLA visibility.", includes: ["Full Ticket Lifecycle", "Basic SLA Monitoring", "Email Notifications", "Audit Logging", "CSV Export"], cta: "Get Started", featured: false },
    { name: "Enterprise", description: "Designed for multi-organization environments requiring advanced analytics, SLA customization, and expanded governance controls.", includes: ["Multi-Organization Support", "Custom SLA Configuration", "Advanced Analytics", "Messaging Routing Controls", "Priority Support"], cta: "Contact Sales", featured: true },
  ];

  return (
    <section className="py-16" id="pricing" style={{ background: "hsl(30 5% 98%)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="text-3xl font-bold text-foreground mb-2">Transparent, Scalable Pricing</h2>
          <p className="text-[14px] text-muted-foreground max-w-md mx-auto">Purpose-built plans aligned to organizational scale and operational complexity.</p>
        </div>
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative rounded-2xl flex flex-col overflow-hidden transition-all duration-200"
              style={plan.featured ? { background: "linear-gradient(150deg, hsl(285 48% 23%), hsl(285 50% 30%))", border: "1px solid hsl(285 50% 42% / 0.5)", boxShadow: "0 0 0 1px hsl(32 95% 52% / 0.12), 0 20px 50px hsl(285 45% 12% / 0.6)" } : { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 16px hsl(285 25% 10% / 0.06)" }}
            >
              {plan.featured && (
                <>
                  <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, hsl(32 95% 52% / 0.15), transparent 65%)" }} />
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(32 95% 52% / 0.6), transparent)" }} />
                </>
              )}
              <div className="px-6 pt-6 pb-5" style={{ borderBottom: plan.featured ? "1px solid hsl(285 40% 35% / 0.5)" : "1px solid hsl(var(--border))" }}>
                {plan.featured && (
                  <span className="inline-block mb-3 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.14em]" style={{ background: "hsl(32 95% 52% / 0.18)", color: "hsl(32 95% 70%)", border: "1px solid hsl(32 95% 52% / 0.3)" }}>
                    Recommended
                  </span>
                )}
                <h3 className={`text-xl font-bold mb-2 ${plan.featured ? "text-white" : "text-foreground"}`}>{plan.name}</h3>
                <p className={`text-[13px] leading-relaxed ${plan.featured ? "text-white/55" : "text-muted-foreground"}`}>{plan.description}</p>
              </div>
              <div className="px-6 py-5 flex-1">
                <p className={`text-[9px] font-black uppercase tracking-[0.14em] mb-3 ${plan.featured ? "text-white/35" : "text-muted-foreground/70"}`}>Includes</p>
                <ul className="space-y-2.5">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={plan.featured ? { background: "hsl(32 95% 52% / 0.18)" } : { background: "hsl(var(--primary) / 0.08)" }}>
                        <CheckCircle2 className={`h-2.5 w-2.5 ${plan.featured ? "text-accent" : "text-primary"}`} />
                      </div>
                      <span className={`text-[13px] ${plan.featured ? "text-white/70" : "text-foreground/80"}`}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 pb-6">
                {plan.featured ? (
                  <PrimaryButton className="w-full justify-center">{plan.cta} <ArrowRight className="h-4 w-4" /></PrimaryButton>
                ) : (
                  <button type="button" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all duration-200 hover:-translate-y-px" style={{ background: "linear-gradient(135deg, hsl(285 45% 28%), hsl(285 50% 36%))", boxShadow: "0 2px 10px hsl(285 45% 30% / 0.3)" }}>
                    {plan.cta} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section className="relative py-16 overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(285 50% 12%), hsl(285 45% 18%))" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 60%, hsl(32 95% 52% / 0.08) 0%, transparent 60%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(hsl(285 45% 55% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(285 45% 55% / 0.03) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(285 45% 50% / 0.4), transparent)" }} />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">Ready to Transform Field Operations?</h2>
          <p className="text-[15px] leading-relaxed mb-8" style={{ color: "hsl(285 15% 58%)" }}>Bring operational discipline, SLA transparency, and verifiable outcomes to your service workflows.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <PrimaryButton asLink to="/login" className="text-[15px]" style={{ padding: "13px 32px" }}>
              Login to Dashboard <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const footerLinks = ["About", "Modules", "Enterprise", "Pricing", "Documentation"];

  return (
    <footer style={{ background: "hsl(285 50% 8%)", borderTop: "1px solid hsl(285 40% 14%)" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-6 pb-6" style={{ borderBottom: "1px solid hsl(285 40% 13%)" }}>
          <div className="flex items-center gap-3">
            <LogoMark size={32} />
            <div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-white">Sahaya</span>
                <span className="text-[9px] font-semibold tracking-[0.16em] uppercase" style={{ color: "hsl(285 15% 42%)" }}>by Pariskq</span>
              </div>
              <p className="text-[12px] mt-1" style={{ color: "hsl(285 15% 40%)" }}>Intelligent Field Operations. Verified Outcomes.</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-1.5 items-center">
            {footerLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase()}`} className="text-[13px] transition-colors duration-150" style={{ color: "hsl(285 15% 42%)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "hsl(285 15% 65%)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "hsl(285 15% 42%)"; }}>
                {link}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px]" style={{ color: "hsl(285 15% 32%)" }}>© 2026 Pariskq. All rights reserved.</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(32 95% 48%)" }}>Precision Meets Perfection</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SahayaLanding() {
  return (
    <div className="min-h-screen font-sans antialiased">
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <IntegrityChainSection />
        <ModulesSection />
        <EnterpriseSection />
        <PricingSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
