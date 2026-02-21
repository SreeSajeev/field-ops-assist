import { useState } from 'react';
import { AppLayoutNew } from '@/components/layout/AppLayoutNew';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmailsTable } from '@/components/emails/EmailsTable';
import { EmailDetailSheet } from '@/components/emails/EmailDetailSheet';
import { useRawEmails } from '@/hooks/useRawEmails';
import { RawEmailWithParsed, EmailProcessingStatus } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Search, 
  Filter,
  RefreshCw,
  FileSearch,
  FileQuestion,
  AlertTriangle,
  Ticket,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const STATUS_FILTERS: { value: EmailProcessingStatus | 'all'; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'all', label: 'All Emails', icon: Mail, color: 'bg-muted' },
  { value: 'RECEIVED', label: 'Received', icon: Mail, color: 'bg-blue-500' },
  { value: 'PARSED', label: 'Parsed', icon: FileSearch, color: 'bg-purple-500' },
  { value: 'DRAFT', label: 'Draft', icon: FileQuestion, color: 'bg-amber-500' },
  { value: 'NEEDS_REVIEW', label: 'Needs Review', icon: AlertTriangle, color: 'bg-orange-500' },
  { value: 'TICKET_CREATED', label: 'Ticket Created', icon: Ticket, color: 'bg-green-500' },
  { value: 'ERROR', label: 'Error', icon: AlertCircle, color: 'bg-red-500' },
];

export default function RawEmails() {
  const { data: emails, isLoading, refetch } = useRawEmails();
  const [selectedEmail, setSelectedEmail] = useState<RawEmailWithParsed | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailProcessingStatus | 'all'>('all');

  const handleViewEmail = (email: RawEmailWithParsed) => {
    setSelectedEmail(email);
    setSheetOpen(true);
  };

  const handleReparse = (emailId: string) => {
    // This would trigger a backend re-parse action
    toast({
      title: 'Re-parse triggered',
      description: 'The email will be re-processed by the parsing engine.',
    });
  };

  const handleCreateTicket = (email: RawEmailWithParsed) => {
    // This would open a ticket creation flow with pre-filled data
    toast({
      title: 'Create ticket',
      description: 'Opening ticket creation form...',
    });
    // Navigate to ticket creation or open modal
  };

  // Filter emails
  const filteredEmails = (emails || []).filter((email) => {
    const matchesSearch = !search || 
      email.subject?.toLowerCase().includes(search.toLowerCase()) ||
      email.from_email.toLowerCase().includes(search.toLowerCase()) ||
      email.parsed_email?.complaint_id?.toLowerCase().includes(search.toLowerCase()) ||
      email.parsed_email?.vehicle_number?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || email.processing_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate status counts
  const statusCounts = (emails || []).reduce((acc, email) => {
    acc[email.processing_status] = (acc[email.processing_status] || 0) + 1;
    return acc;
  }, {} as Record<EmailProcessingStatus, number>);

  return (
    <AppLayoutNew>
      <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Raw Emails</h1>
              <p className="text-muted-foreground text-sm">
                Inbound emails from Postmark webhook • Immutable archive
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((filter) => {
            const count = filter.value === 'all' 
              ? emails?.length || 0 
              : statusCounts[filter.value as EmailProcessingStatus] || 0;
            const isActive = statusFilter === filter.value;
            
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <filter.icon className="h-3.5 w-3.5" />
                {filter.label}
                <Badge 
                  variant={isActive ? 'secondary' : 'outline'} 
                  className="ml-1 h-5 px-1.5 text-xs"
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by subject, sender, complaint ID, vehicle..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Emails Table */}
        <EmailsTable
          emails={filteredEmails}
          loading={isLoading}
          onViewEmail={handleViewEmail}
          onReparse={handleReparse}
          onCreateTicket={handleCreateTicket}
        />

        {/* Email Detail Sheet */}
        <EmailDetailSheet
          email={selectedEmail}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onReparse={handleReparse}
          onCreateTicket={handleCreateTicket}
        />
      </div>
    </PageContainer>
    </AppLayoutNew>
  );
}