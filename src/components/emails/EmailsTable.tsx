import { RawEmailWithParsed } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailStatusLifecycle } from './EmailStatusLifecycle';
import { ConfidenceScore } from '@/components/tickets/ConfidenceScore';
import { format } from 'date-fns';
import { Eye, RefreshCw, Plus, Mail, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailsTableProps {
  emails: RawEmailWithParsed[];
  loading?: boolean;
  onViewEmail?: (email: RawEmailWithParsed) => void;
  onReparse?: (emailId: string) => void;
  onCreateTicket?: (email: RawEmailWithParsed) => void;
}

export function EmailsTable({ 
  emails, 
  loading, 
  onViewEmail,
  onReparse,
  onCreateTicket 
}: EmailsTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
          <Mail className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No emails yet</h3>
        <p className="text-muted-foreground mt-1 max-w-md">
          When emails arrive via the Postmark webhook, they will appear here for processing.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[280px]">Subject / Sender</TableHead>
            <TableHead className="w-[320px]">Processing Status</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Parsed Fields</TableHead>
            <TableHead className="w-[140px]">Received</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => {
            const parsed = email.parsed_email;
            const parsedFieldsCount = parsed ? [
              parsed.complaint_id,
              parsed.vehicle_number,
              parsed.category,
              parsed.issue_type,
              parsed.location
            ].filter(Boolean).length : 0;

            return (
              <TableRow 
                key={email.id} 
                className="data-table-row cursor-pointer"
                onClick={() => onViewEmail?.(email)}
              >
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-sm line-clamp-1">
                      {email.subject || '(No subject)'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {email.from_email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <EmailStatusLifecycle
                    currentStatus={email.processing_status}
                    receivedAt={email.received_at}
                    parsedAt={parsed?.created_at}
                    confidenceScore={parsed?.confidence_score}
                  />
                </TableCell>
                <TableCell>
                  {parsed?.confidence_score !== null && parsed?.confidence_score !== undefined ? (
                    <ConfidenceScore score={parsed.confidence_score} showLabel={false} />
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {parsed ? (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {parsedFieldsCount}/5 fields
                      </Badge>
                      {parsed.complaint_id && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {parsed.complaint_id}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not parsed</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(email.received_at), 'MMM d, HH:mm')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onViewEmail?.(email)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {email.processing_status !== 'TICKET_CREATED' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onReparse?.(email.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {(email.processing_status === 'DRAFT' || email.processing_status === 'NEEDS_REVIEW' || email.processing_status === 'PARSED') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-primary"
                            onClick={() => onCreateTicket?.(email)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    {email.processing_status === 'TICKET_CREATED' && email.linked_ticket_id && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-green-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}