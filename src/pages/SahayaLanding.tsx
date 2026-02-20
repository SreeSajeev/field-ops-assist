import { Link } from "react-router-dom";
import {
  Mail,
  FileSearch,
  CheckCircle2,
  Ticket,
  Bell,
  UserPlus,
  MapPin,
  Camera,
  Shield,
  ShieldCheck,
  FileText,
  LayoutDashboard,
  Gauge,
  Users,
  MessageSquare,
  ClipboardList,
  Building2,
  Lock,
  BarChart3,
  Download,
  Settings,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { icon: Mail, title: "Ingest", description: "Every inbound email is automatically captured and structured for processing." },
  { icon: FileSearch, title: "Parse", description: "Structured extraction of complaint ID, vehicle, issue type, location, and remarks." },
  { icon: CheckCircle2, title: "Validate", description: "Required-field checks determine OPEN vs NEEDS_REVIEW state." },
  { icon: Ticket, title: "Create Ticket", description: "Single source of truth with unique ticket number and full lifecycle tracking." },
  { icon: Bell, title: "Notify", description: "Automated confirmation and optional missing-details emails to the requester." },
  { icon: UserPlus, title: "Assign", description: "Staff assigns a Field Executive; assignment is recorded and auditable." },
  { icon: MapPin, title: "On-Site Token", description: "Time-bound token for proof of arrival; FE confirms on-site with one click." },
  { icon: Camera, title: "Resolution Proof", description: "FE submits resolution proof; ticket moves to RESOLVED_PENDING_VERIFICATION." },
  { icon: ShieldCheck, title: "Verify & Close", description: "Staff verifies and closes the ticket; customer receives resolution notification." },
  { icon: FileText, title: "Audit", description: "Every state transition and key action is logged for full traceability." },
];

const MODULES = [
  { icon: LayoutDashboard, title: "Ticket Intelligence Engine", summary: "Email-to-ticket automation with validation and lifecycle tracking.", capabilities: ["Automatic email ingestion and parsing", "Required-field and confidence validation", "OPEN / NEEDS_REVIEW workflow", "End-to-end ticket lifecycle"] },
  { icon: Gauge, title: "SLA Intelligence Dashboard", summary: "Assignment, On-Site, and Resolution SLA tracking with compliance metrics.", capabilities: ["Three-phase SLA (Assignment, On-Site, Resolution)", "Real-time countdown and breach flags", "Compliance % and trend analytics", "Export and reporting"] },
  { icon: Users, title: "Field Executive Control", summary: "Token-based verification, time-bound links, and proof capture.", capabilities: ["Token-based on-site and resolution proof", "Time-bound action links", "Proof capture and reassignment capability", "FE-specific ticket view"] },
  { icon: MessageSquare, title: "Communication Automation", summary: "Email notifications and configurable routing with event logging.", capabilities: ["Confirmation and missing-details emails", "Assignment and token delivery", "Resolution notifications", "Event logging for audit"] },
  { icon: ClipboardList, title: "Audit & Compliance Layer", summary: "Every state transition logged. Full traceability.", capabilities: ["State change audit trail", "Assignment and comment history", "Entity-level audit logs", "Compliance-ready export"] },
  { icon: Building2, title: "Multi-Tenant SaaS Architecture", summary: "Role-based access control and organization scoping.", capabilities: ["Super Admin (global visibility)", "Admin (org-scoped)", "Staff & Field Executive roles", "SaaS-ready foundation"] },
];

const ENTERPRISE_FEATURES = [
  { icon: Lock, label: "Role-Based Access Control" },
  { icon: Settings, label: "SLA Configuration" },
  { icon: BarChart3, label: "Performance Analytics" },
  { icon: Download, label: "CSV Export" },
  { icon: FileText, label: "Audit Trails" },
  { icon: ShieldCheck, label: "Secure Authentication" },
  { icon: Zap, label: "Scalable Architecture" },
];

const STATS = [
  { label: "Tickets Processed", value: "—", icon: Ticket, variant: "primary" as const },
  { label: "SLA Compliance", value: "—", icon: Gauge, variant: "accent" as const },
  { label: "Avg Resolution Time", value: "—", icon: Clock, variant: "primary" as const },
  { label: "Audit Events Logged", value: "—", icon: FileText, variant: "accent" as const },
];

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function MarketingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg logo-bg-accent shadow-glow">
            <Shield className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <span className="text-base font-semibold text-foreground">Sahaya</span>
            <span className="ml-1 block text-xs text-muted-foreground">by Pariskq</span>
          </div>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground">About</a>
          <a href="#modules" className="text-sm font-medium text-muted-foreground hover:text-foreground">Modules</a>
          <a href="#enterprise" className="text-sm font-medium text-muted-foreground hover:text-foreground">Documentation</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">Pricing</a>
          <Button asChild className="btn-primary">
            <Link to="/login">Login</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero pt-16 text-primary-foreground">
      <div className="absolute inset-0 hero-radial-glow" />
      <div className="container relative mx-auto px-6 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground/90">
            Field Operations Platform
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Sahaya <span className="text-gradient-accent">by Pariskq</span>
          </h1>
          <p className="mt-6 text-xl font-semibold text-primary-foreground/95 sm:text-2xl">
            Intelligent Field Operations. Verified Outcomes.
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/80">
            Sahaya transforms inbound service requests into structured, auditable, SLA-tracked workflows with proof at every step. No dropped tickets, no unverified closures, full visibility for teams and customers.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="btn-primary">
              <Link to="/login">Login to Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <a href="#pricing">Request Demo</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="border-t border-border bg-muted/30 py-16">
      <div className="container mx-auto px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-lg p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                stat.variant === "primary" ? "stat-card-primary" : "stat-card-accent"
              }`}
            >
              <stat.icon className="h-6 w-6 opacity-90" />
              <p className="mt-4 text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IntegrityChainSection() {
  return (
    <section id="about" className="scroll-mt-20 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          The 10-Step Integrity Chain
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          From inbound email to verified closure — every step is structured and auditable.
        </p>
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="card-interactive flex flex-col rounded-lg border border-border bg-card p-6 shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Step {i + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModulesSection() {
  return (
    <section id="modules" className="scroll-mt-20 border-t border-border bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Core Product Modules
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Built for reliability and scale.
        </p>
        <div className="mx-auto mt-14 grid max-w-6xl gap-8 lg:grid-cols-3">
          {MODULES.map((mod) => (
            <div
              key={mod.title}
              className="card-interactive flex flex-col rounded-lg border border-border bg-card p-6 shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <mod.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{mod.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{mod.summary}</p>
              <ul className="mt-4 space-y-2">
                {mod.capabilities.map((cap) => (
                  <li key={cap} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EnterpriseSection() {
  return (
    <section id="enterprise" className="scroll-mt-20 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Enterprise Features
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Security, visibility, and control at scale.
        </p>
        <div className="mx-auto mt-14 flex max-w-4xl flex-wrap justify-center gap-6">
          {ENTERPRISE_FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-6 py-4 shadow-card"
            >
              <f.icon className="h-5 w-5 text-primary" />
              <span className="font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Pricing
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Choose the plan that fits your operations.
        </p>
        <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
            <h3 className="text-xl font-semibold">Standard</h3>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />Single Organization</li>
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />Email + Basic SLA</li>
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />Full Ticket Lifecycle</li>
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />CSV Export</li>
            </ul>
            <Button className="mt-6 w-full btn-primary">Get Started</Button>
          </div>
          <div className="rounded-2xl border-2 border-primary bg-primary/5 p-8 shadow-lg">
            <h3 className="text-xl font-semibold">Enterprise</h3>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />Multi-Organization</li>
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />Custom SLA</li>
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />Advanced Analytics</li>
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />Messaging Routing</li>
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />Priority Support</li>
            </ul>
            <Button className="mt-6 w-full btn-primary">Contact Sales</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 text-primary-foreground">
      <div className="absolute inset-0 hero-radial-glow" />
      <div className="container relative mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to Transform Field Operations?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
          Join teams that run on verified outcomes and full traceability.
        </p>
        <Button asChild size="lg" className="btn-primary mt-8 shadow-glow">
          <Link to="/login">Login to Dashboard</Link>
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
        Sahaya by Pariskq — Intelligent Field Operations. Verified Outcomes.
      </div>
    </footer>
  );
}

export default function SahayaLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <HeroSection />
      <StatsSection />
      <IntegrityChainSection />
      <ModulesSection />
      <EnterpriseSection />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
