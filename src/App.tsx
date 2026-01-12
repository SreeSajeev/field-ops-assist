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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tickets" element={<TicketsList />} />
            <Route path="/tickets/:ticketId" element={<TicketDetail />} />
            <Route path="/review" element={<ReviewQueue />} />
            <Route path="/emails" element={<RawEmails />} />
            <Route path="/field-executives" element={<FieldExecutives />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;