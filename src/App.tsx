/*
 * App.tsx - Main Application Router
 * 
 * Route Structure:
 * - /fe/ticket/:ticketId - Public FE token-based access (no auth required)
 * - /fe/action/:tokenId - Public FE action page (no auth required)
 * - /* - Protected routes requiring authentication
 *   - / - Dashboard (routes FE to their portal, Staff to dashboard)
 *   - /tickets, /review, etc. - Staff-only routes
 * 
 * Authentication is handled by AuthProvider wrapping protected routes.
 * Role-based routing is handled by Index.tsx based on user role.
 
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

import Index from "./pages/Index";
import TicketsList from "./pages/TicketsList";
import TicketDetail from "./pages/TicketDetail";
import ReviewQueue from "./pages/ReviewQueue";
import RawEmails from "./pages/RawEmails";
import FieldExecutives from "./pages/FieldExecutives";
import SLAMonitor from "./pages/SLAMonitor";
import AuditLogs from "./pages/AuditLogs";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import FEActionPage from "@/pages/FEActionPage";

// Token-based FE access (no auth required)
import FETicketView from "./pages/FETicketView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Routes>
          
          <Route
            path="/fe/ticket/:ticketId"
            element={<FETicketView />}
          />
          <Route
            path="/fe/action/:tokenId"
            element={<FEActionPage />}
          />

          <Route
            path="/*"
            element={
              <AuthProvider>
                <Routes>
                
                  <Route path="/" element={<Index />} />
                  
              
                  <Route path="/tickets" element={<TicketsList />} />
                  <Route path="/tickets/:ticketId" element={<TicketDetail />} />
                  <Route path="/review" element={<ReviewQueue />} />
                  <Route path="/emails" element={<RawEmails />} />
                  <Route path="/field-executives" element={<FieldExecutives />} />
                  <Route path="/sla" element={<SLAMonitor />} />
                  <Route path="/audit" element={<AuditLogs />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
                  
                
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            }
          />
        </Routes>

      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
*/
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthProvider } from "@/hooks/useAuth";
import {
  RequireStaff,
  RequireFE,
  RequireSuperAdmin,
  RequireClient,
} from "@/components/auth/AuthGuards";

// Pages
import SahayaLanding from "@/pages/SahayaLanding";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import TicketsList from "@/pages/TicketsList";
import TicketDetail from "@/pages/TicketDetail";
import ReviewQueue from "@/pages/ReviewQueue";
import RawEmails from "@/pages/RawEmails";
import FieldExecutives from "@/pages/FieldExecutives";
import SLAMonitor from "@/pages/SLAMonitor";
import AuditLogs from "@/pages/AuditLogs";
import Analytics from "@/pages/Analytics";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

// FE pages
import FEMyTickets from "@/pages/FEMyTickets";
import FETicketView from "@/pages/FETicketView";
import FEActionPage from "@/pages/FEActionPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <AuthProvider>
            <Routes>
              {/* ========================= */}
              {/* 🌐 PUBLIC — LANDING */}
              {/* ========================= */}
              <Route path="/" element={<SahayaLanding />} />

              {/* Login + role-based redirect */}
              <Route path="/login" element={<Index />} />

              {/* Token-based FE action (NO LOGIN REQUIRED) */}
              <Route
                path="/fe/action/:tokenId"
                element={<FEActionPage />}
              />

              {/* ========================= */}
              {/* 🚚 FIELD EXECUTIVE */}
              {/* ========================= */}
              <Route element={<RequireFE />}>
                <Route path="/fe" element={<FEMyTickets />} />
                <Route
                  path="/fe/ticket/:ticketId"
                  element={<FETicketView />}
                />
              </Route>

              {/* ========================= */}
              {/* 👑 SUPER ADMIN (SaaS layer) */}
              {/* ========================= */}
              <Route element={<RequireSuperAdmin />}>
                <Route path="/super-admin" element={<SuperAdminDashboard />} />
              </Route>

              {/* ========================= */}
              {/* 📋 CLIENT */}
              {/* ========================= */}
              <Route
                path="/app/client"
                element={
                  <RequireClient>
                    <ClientDashboard />
                  </RequireClient>
                }
              />

              {/* ========================= */}
              {/* 🧑‍💼 STAFF / ADMIN */}
              {/* ========================= */}
              <Route element={<RequireStaff />}>
                <Route path="/app" element={<Dashboard />} />
                <Route path="/app/tickets" element={<TicketsList />} />
                <Route
                  path="/app/tickets/:ticketId"
                  element={<TicketDetail />}
                />
                <Route path="/app/review" element={<ReviewQueue />} />
                <Route path="/app/emails" element={<RawEmails />} />
                <Route
                  path="/app/field-executives"
                  element={<FieldExecutives />}
                />
                <Route path="/app/sla" element={<SLAMonitor />} />
                <Route path="/app/audit" element={<AuditLogs />} />
                <Route path="/app/analytics" element={<Analytics />} />
                <Route path="/app/users" element={<Users />} />
                <Route path="/app/settings" element={<Settings />} />
              </Route>

              {/* ========================= */}
              {/* ❌ 404 */}
              {/* ========================= */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
