import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FECard, FECardSkeleton } from '@/components/field-executives/FECard';
import { FEDetailSheet } from '@/components/field-executives/FEDetailSheet';
import { CreateFEModal } from '@/components/field-executives/CreateFEModal';
import { useFieldExecutivesWithStats } from '@/hooks/useFieldExecutives';
import { FieldExecutive, FieldExecutiveWithStats } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Truck, 
  Search, 
  Filter,
  RefreshCw,
  Users,
  CheckCircle2,
  AlertCircle,
  Info,
  UserPlus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * FieldExecutives page with ability to create new FEs.
 * Service staff can add new field executives via the "Add Field Executive" button.
 */
export default function FieldExecutives() {
  const { data: executives, isLoading, refetch } = useFieldExecutivesWithStats();
  const [selectedFE, setSelectedFE] = useState<FieldExecutiveWithStats | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createFEModalOpen, setCreateFEModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [workloadFilter, setWorkloadFilter] = useState<'all' | 'available' | 'low' | 'moderate' | 'high'>('all');

  const handleViewFE = (fe: FieldExecutive) => {
    const feWithStats = executives?.find(e => e.id === fe.id);
    if (feWithStats) {
      setSelectedFE(feWithStats);
      setSheetOpen(true);
    }
  };

  // Filter executives
  const filteredExecutives = (executives || []).filter((fe) => {
    const matchesSearch = !search || 
      fe.name.toLowerCase().includes(search.toLowerCase()) ||
      fe.base_location?.toLowerCase().includes(search.toLowerCase()) ||
      fe.phone?.includes(search);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && fe.active) ||
      (statusFilter === 'inactive' && !fe.active);

    const matchesWorkload = (() => {
      if (workloadFilter === 'all') return true;
      if (workloadFilter === 'available') return fe.active_tickets === 0;
      if (workloadFilter === 'low') return fe.active_tickets > 0 && fe.active_tickets <= 2;
      if (workloadFilter === 'moderate') return fe.active_tickets > 2 && fe.active_tickets <= 4;
      if (workloadFilter === 'high') return fe.active_tickets > 4;
      return true;
    })();
    
    return matchesSearch && matchesStatus && matchesWorkload;
  });

  // Calculate summary stats
  const totalActive = (executives || []).filter(fe => fe.active).length;
  const totalInactive = (executives || []).filter(fe => !fe.active).length;
  const availableFEs = (executives || []).filter(fe => fe.active && fe.active_tickets === 0).length;
  const highWorkload = (executives || []).filter(fe => fe.active_tickets > 4).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Field Executives</h1>
              <p className="text-muted-foreground text-sm">
                Team profiles, skills, and workload visibility
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {/* Requirement 4: Add Field Executive Button */}
            <Button 
              size="sm"
              onClick={() => setCreateFEModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Field Executive
            </Button>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <strong>View-only page:</strong> This page shows FE profiles and workload. 
            Ticket assignments are made from the <strong>Ticket Detail</strong> page to ensure proper workflow control.
          </AlertDescription>
        </Alert>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              Total Active
            </div>
            <p className="text-2xl font-bold">{totalActive}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Available Now
            </div>
            <p className="text-2xl font-bold text-green-600">{availableFEs}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              High Workload
            </div>
            <p className="text-2xl font-bold text-amber-600">{highWorkload}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              Inactive
            </div>
            <p className="text-2xl font-bold text-muted-foreground">{totalInactive}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, phone..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={workloadFilter} onValueChange={(v) => setWorkloadFilter(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Workload" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workload</SelectItem>
              <SelectItem value="available">Available (0)</SelectItem>
              <SelectItem value="low">Low (1-2)</SelectItem>
              <SelectItem value="moderate">Moderate (3-4)</SelectItem>
              <SelectItem value="high">High (5+)</SelectItem>
            </SelectContent>
          </Select>

          {(statusFilter !== 'all' || workloadFilter !== 'all' || search) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setWorkloadFilter('all');
                setSearch('');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredExecutives.length} of {executives?.length || 0} field executives
        </div>

        {/* Grid of FE Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <FECardSkeleton key={i} />
            ))}
          </div>
        ) : filteredExecutives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No field executives found</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              {search || statusFilter !== 'all' || workloadFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Field executives will appear here once added to the system.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExecutives.map((fe) => (
              <FECard
                key={fe.id}
                executive={fe}
                onClick={handleViewFE}
              />
            ))}
          </div>
        )}

        {/* FE Detail Sheet */}
        <FEDetailSheet
          executive={selectedFE}
          stats={selectedFE ? {
            active_tickets: selectedFE.active_tickets,
            resolved_this_week: selectedFE.resolved_this_week,
            avg_resolution_time_hours: selectedFE.avg_resolution_time_hours,
            sla_compliance_rate: selectedFE.sla_compliance_rate,
          } : undefined}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />

        {/* Create FE Modal - Requirement 4 */}
        <CreateFEModal open={createFEModalOpen} onOpenChange={setCreateFEModalOpen} />
      </div>
    </DashboardLayout>
  );
}