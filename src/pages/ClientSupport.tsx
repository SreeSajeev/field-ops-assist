import { useState } from "react";
import { ClientHeader, DashboardFooter } from "@/pages/ClientDashboard";
import { CreateTicketModal } from "@/components/tickets/CreateTicketModal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Plus, Ticket } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Client Support: create tickets (same insertion as staff). Ticket gets
 * opened_by_email = client email, client_slug = user.client_slug, status = OPEN.
 * No FE assignment, no SLA controls — only ticket creation form.
 */
export default function ClientSupport() {
  const { user, userProfile } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const email = user?.email ?? "";
  const clientSlug = userProfile?.client_slug ?? null;
  const canCreate = !!email && !!clientSlug;
  const clientContext = canCreate
    ? { openedByEmail: email, clientSlug }
    : null;

  return (
    <div className="min-h-screen" style={{ background: "hsl(30 5% 98%)" }}>
      <ClientHeader />
      <main className="pt-14">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="mb-8 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0 text-white"
              style={{
                background: "linear-gradient(145deg, hsl(285 50% 30%), hsl(285 55% 40%))",
                boxShadow: "0 2px 8px hsl(285 45% 30% / 0.3)",
              }}
            >
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Support
              </h1>
              <p className="text-sm text-muted-foreground">
                Submit a support request and track it from your dashboard.
              </p>
            </div>
          </div>

          {!canCreate && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                Your account is not linked to a client. Contact your administrator to submit support requests.
              </AlertDescription>
            </Alert>
          )}

          <Card
            className="overflow-hidden"
            style={{
              border: "1px solid hsl(270 15% 88% / 0.8)",
              boxShadow: "0 4px 16px hsl(285 25% 10% / 0.06), 0 1px 3px hsl(285 25% 10% / 0.04), inset 0 1px 0 hsl(0 0% 100% / 0.8)",
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ticket className="h-5 w-5 text-primary" />
                Create a support request
              </CardTitle>
              <CardDescription>
                Select a category and issue type, add optional details. Your request will be created with status Open and our team will assign a technician as needed. You can track progress on your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                onClick={() => setCreateModalOpen(true)}
                disabled={!canCreate}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create support request
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <DashboardFooter />

      <CreateTicketModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        clientContext={clientContext}
      />
    </div>
  );
}
