/**
 * Tenant Admin Dashboard — DEMO-ONLY
 * Centralized dashboard for ADMIN role. UI-only orchestration; reuses existing hooks and components.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayoutNew } from '@/components/layout/AppLayoutNew';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTickets } from '@/hooks/useTickets';
import { useFieldExecutivesWithStats } from '@/hooks/useFieldExecutives';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { CreateFEModal } from '@/components/field-executives/CreateFEModal';
import {
  LayoutDashboard,
  Ticket,
  Truck,
  Users,
  Building2,
  UserPlus,
  Sliders,
} from 'lucide-react';

export default function TenantAdminDashboard() {
  const { userProfile, signUp } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const organisationId = userProfile?.organisation_id ?? null;

  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [addStaffName, setAddStaffName] = useState('');
  const [addStaffEmail, setAddStaffEmail] = useState('');
  const [addStaffPassword, setAddStaffPassword] = useState('');
  const [addStaffSubmitting, setAddStaffSubmitting] = useState(false);
  const [createFEModalOpen, setCreateFEModalOpen] = useState(false);

  const isAdmin = userProfile?.role === 'ADMIN';

  const { data: stats } = useDashboardStats();
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets({ status: 'all' });
  const { data: executives = [] } = useFieldExecutivesWithStats();

  const { data: org } = useQuery({
    queryKey: ['organisation', organisationId],
    enabled: Boolean(organisationId),
    queryFn: async () => {
      // organisations table exists in DB but may not be in generated Supabase types
      const { data, error } = await (supabase as any)
        .from('organisations')
        .select('id, name, slug')
        .eq('id', organisationId!)
        .single();
      if (error) throw error;
      return data as { id: string; name: string; slug: string };
    },
  });

  const { data: orgUsers = [] } = useQuery({
    queryKey: ['users-org-overview', organisationId],
    enabled: Boolean(organisationId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('users')
        .select('id, role')
        .eq('organisation_id', organisationId!);
      if (error) throw error;
      return (data ?? []) as { id: string; role: string }[];
    },
  });

  const { data: clientSlugs = [] } = useQuery({
    queryKey: ['tenant-clients-overview', organisationId],
    enabled: Boolean(organisationId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('tickets')
        .select('client_slug')
        .eq('organisation_id', organisationId!);
      if (error) throw error;
      const rows = (data ?? []) as { client_slug?: string | null }[];
      const slugs = [...new Set(rows.map((t) => t.client_slug).filter(Boolean))] as string[];
      return slugs;
    },
  });

  if (!isAdmin) {
    return (
      <AppLayoutNew>
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <p className="text-muted-foreground font-medium">Tenant Admin access required.</p>
            <p className="text-sm text-muted-foreground mt-1">This dashboard is only available for tenant administrators.</p>
          </div>
        </PageContainer>
      </AppLayoutNew>
    );
  }

  if (!organisationId) {
    return (
      <AppLayoutNew>
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <p className="text-muted-foreground font-medium">Organisation context required.</p>
          </div>
        </PageContainer>
      </AppLayoutNew>
    );
  }

  const totalTickets = stats?.totalTickets ?? 0;
  const totalFEs = executives.length;
  const totalUsersExcludingClient = orgUsers.filter((u) => u.role !== 'CLIENT').length;
  const totalClients = clientSlugs.length;

  const handleAddStaff = async () => {
    if (!organisationId) return;
    setAddStaffSubmitting(true);
    try {
      const { error } = await signUp(
        addStaffEmail.trim(),
        addStaffPassword,
        addStaffName.trim(),
        'STAFF',
        organisationId
      );
      if (error) {
        toast({ title: 'Failed to add user', description: error.message, variant: 'destructive' });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['users-org-overview', organisationId] });
      queryClient.invalidateQueries({ queryKey: ['users', organisationId] });
      queryClient.invalidateQueries({ queryKey: ['service-managers', organisationId] });
      toast({ title: 'Service Manager created', description: 'They can sign in with the email and password.' });
      setAddStaffOpen(false);
      setAddStaffName('');
      setAddStaffEmail('');
      setAddStaffPassword('');
    } finally {
      setAddStaffSubmitting(false);
    }
  };

  return (
    <AppLayoutNew>
      <PageContainer>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Tenant Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Manage your organisation — users, field executives, tickets, and settings
              </p>
            </div>
          </div>

          {/* 1. Organisation Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organisation Overview
              </CardTitle>
              <CardDescription>{org?.name ?? '—'} {org?.slug ? `(${org.slug})` : ''}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Ticket className="h-4 w-4" />
                    <span className="text-sm font-medium">Total tickets</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{totalTickets}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    <span className="text-sm font-medium">Field executives</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{totalFEs}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Users (excl. clients)</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{totalUsersExcludingClient}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Clients (distinct)</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Workforce Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Workforce Management
              </CardTitle>
              <CardDescription>Add field executives and service managers to your organisation.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => setCreateFEModalOpen(true)}>
                <Truck className="h-4 w-4 mr-2" />
                Add Field Executive
              </Button>
              <Button variant="outline" onClick={() => setAddStaffOpen(true)}>
                <Users className="h-4 w-4 mr-2" />
                Add Service Manager
              </Button>
            </CardContent>
          </Card>

          {/* 3. Ticket Configuration — link to full Ticket Settings page */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Ticket Configuration
              </CardTitle>
              <CardDescription>Configure categories, issue types, and SLA hours for your organisation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link to="/app/ticket-settings">
                  <Sliders className="h-4 w-4 mr-2" />
                  Open Ticket Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 4. Tickets Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Tickets
              </CardTitle>
              <CardDescription>Your organisation&apos;s tickets. Click to view or edit.</CardDescription>
            </CardHeader>
            <CardContent>
              <TicketsTable tickets={tickets} loading={ticketsLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Add Service Manager dialog */}
        <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Service Manager</DialogTitle>
              <DialogDescription>
                Create a user in your organisation with the Service Manager role. They will sign in with the email and password you set.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="staff-name">Name</Label>
                <Input
                  id="staff-name"
                  value={addStaffName}
                  onChange={(e) => setAddStaffName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={addStaffEmail}
                  onChange={(e) => setAddStaffEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff-password">Password</Label>
                <Input
                  id="staff-password"
                  type="password"
                  value={addStaffPassword}
                  onChange={(e) => setAddStaffPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddStaffOpen(false)}>Cancel</Button>
              <Button
                disabled={
                  !addStaffName.trim() ||
                  !addStaffEmail.trim() ||
                  !addStaffPassword ||
                  addStaffSubmitting
                }
                onClick={handleAddStaff}
              >
                {addStaffSubmitting ? 'Creating…' : 'Add Service Manager'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CreateFEModal open={createFEModalOpen} onOpenChange={setCreateFEModalOpen} />
      </PageContainer>
    </AppLayoutNew>
  );
}
