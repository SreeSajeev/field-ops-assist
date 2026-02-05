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
/**
 * App.tsx - Main Application Router
 *
 * Preserves existing behavior:
 * - Index.tsx remains the main dashboard for both FE and Staff
 * - FEActionPage and FETicketView remain token-based and public
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth, RequireStaff } from "@/components/auth/AuthGuards";

// Pages
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

// FE public pages
import FETicketView from "./pages/FETicketView";
import FEActionPage from "./pages/FEActionPage";

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
              {/* 🌐 PUBLIC ROUTES */}
              {/* ========================= */}

              {/* Login / Role Router */}
              <Route path="/" element={<Index />} />

              {/* FE token flows (NO AUTH, NO GUARDS) */}
              <Route path="/fe/ticket/:ticketId" element={<FETicketView />} />
              <Route path="/fe/action/:tokenId" element={<FEActionPage />} />

              {/* ========================= */}
              {/* 🔒 AUTHENTICATED APP */}
              {/* ========================= */}
              <Route element={<RequireAuth />}>
                <Route element={<RequireStaff />}>
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
                </Route>
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
