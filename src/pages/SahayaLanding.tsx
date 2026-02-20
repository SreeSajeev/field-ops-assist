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
  {
    icon: Mail,
    title: "Ingest",
    description:
      "Every inbound email is automatically captured and structured for processing.",
  },
  {
    icon: FileSearch,
    title: "Parse",
    description:
      "Structured extraction of complaint ID, vehicle, issue type, location, and remarks.",
  },
  {
    icon: CheckCircle2,
    title: "Validate",
    description:
      "Required-field checks and confidence scoring determine OPEN vs NEEDS_REVIEW state.",
  },
  {
    icon: Ticket,
    title: "Create Ticket",
    description:
      "Single source of truth with unique ticket number and full lifecycle tracking.",
  },
  {
    icon: Bell,
    title: "Notify",
    description:
      "Automated confirmation and optional missing-details emails to the requester.",
  },
  {
    icon: UserPlus,
    title: "Assign",
    description:
      "Staff assigns a Field Executive; assignment is recorded and auditable.",
  },
  {
    icon: MapPin,
    title: "On-Site Token",
    description:
      "Time-bound token for proof of arrival; FE confirms on-site with one click.",
  },
  {
    icon: Camera,
    title: "Resolution Proof",
    description:
      "FE submits resolution proof; ticket moves to RESOLVED_PENDING_VERIFICATION.",
  },
  {
    icon: ShieldCheck,
    title: "Verify & Close",
    description:
      "Staff verifies and closes the ticket; customer receives resolution notification.",
  },
  {
    icon: FileText,
    title: "Audit",
    description:
      "Every state transition and key action is logged for full traceability.",
  },
];

const MODULES = [
  {
    icon: LayoutDashboard,
    title: "Ticket Intelligence Engine",
    summary: "Email-to-ticket automation with validation and lifecycle tracking.",
    capabilities: [
      "Automatic email ingestion and parsing",
      "Required-field and confidence validation",
      "OPEN / NEEDS_REVIEW workflow",
      "End-to-end ticket lifecycle",
    ],
  },
  {
    icon: Gauge,
    title: "SLA Intelligence Dashboard",
    summary: "Assignment, On-Site, and Resolution SLA tracking with compliance metrics.",
    capabilities: [
      "Three-phase SLA (Assignment, On-Site, Resolution)",
      "Real-time countdown and breach flags",
      "Compliance % and trend analytics",
      "Export and reporting",
    ],
  },
  {
    icon: Users,
    title: "Field Executive Control",
    summary: "Token-based verification, time-bound links, and proof capture.",
    capabilities: [
      "Token-based on-site and resolution proof",
      "Time-bound action links",
      "Proof capture and reassignment capability",
      "FE-specific ticket view",
    ],
  },
  {
    icon: MessageSquare,
    title: "Communication Automation",
    summary: "Email notifications and configurable routing with event logging.",
    capabilities: [
      "Confirmation and missing-details emails",
      "Assignment and token delivery",
      "Resolution notifications",
      "Event logging for audit",
    ],
  },
  {
    icon: ClipboardList,
    title: "Audit & Compliance Layer",
    summary: "Every state transition logged. Full traceability.",
    capabilities: [
      "State change audit trail",
      "Assignment and comment history",
      "Entity-level audit logs",
      "Compliance-ready export",
    ],
  },
  {
    icon: Building2,
    title: "Multi-Tenant SaaS Architecture",
    summary: "Role-based access control and organization scoping.",
    capabilities: [
      "Super Admin (global visibility)",
      "Admin (org-scoped)",
      "Staff & Field Executive roles",
      "SaaS-ready foundation",
    ],
  },
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

export default function SahayaLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ========== SECTION 1 — HERO ========== */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#16213e] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.15),transparent)]" />
        <div className="container relative mx-auto px-4 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-amber-400/90">
              Field Operations Platform
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Sahaya{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                by Pariskq
              </span>
            </h1>
            <p className="mt-6 text-xl font-medium text-white/95 sm:text-2xl">
              Intelligent Field Operations. Verified Outcomes.
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80">
              Sahaya transforms inbound service requests into structured, auditable,
              SLA-tracked workflows with proof at every step. No dropped tickets, no
              unverified closures, full visibility for teams and customers.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-amber-500 font-semibold text-white hover:bg-amber-600"
              >
                <Link to="/login">Login to Dashboard</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <a href="#pricing">Request Demo</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ========== SECTION 2 — 10-STEP INTEGRITY CHAIN ========== */}
      <section className="border-t border-border/50 bg-muted/30 py-20">
        <div className="container mx-auto px-4">
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
                className="flex flex-col rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
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

      {/* ========== SECTION 3 — CORE PRODUCT MODULES ========== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Core Product Modules
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Built for reliability and scale.
          </p>
          <div className="mx-auto mt-14 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((mod) => (
              <div
                key={mod.title}
                className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
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

      {/* ========== SECTION 4 — ENTERPRISE FEATURES ========== */}
      <section className="border-t border-border/50 bg-muted/30 py-20">
        <div className="container mx-auto px-4">
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
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-6 py-4 shadow-sm"
              >
                <f.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 5 — PRICING (VISUAL ONLY) ========== */}
      <section id="pricing" className="scroll-mt-20 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Choose the plan that fits your operations.
          </p>
          <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-border bg-card p-8 shadow-lg">
              <h3 className="text-xl font-semibold">Standard</h3>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  Single Organization
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  Email + Basic SLA
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  Full Ticket Lifecycle
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  CSV Export
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-primary bg-primary/5 p-8 shadow-lg">
              <h3 className="text-xl font-semibold">Enterprise</h3>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  Multi-Organization
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  Custom SLA
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  Advanced Analytics
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  Messaging Routing
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  Priority Support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 6 — CTA ========== */}
      <section className="border-t border-border/50 bg-gradient-to-br from-[#1a0b2e]/95 to-[#2d1b4e]/95 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Transform Field Operations?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            Join teams that run on verified outcomes and full traceability.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-amber-500 font-semibold text-white hover:bg-amber-600"
          >
            <Link to="/login">Login to Dashboard</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Sahaya by Pariskq — Intelligent Field Operations. Verified Outcomes.
        </div>
      </footer>
    </div>
  );
}
