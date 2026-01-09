import { TicketStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'status-open' },
  NEEDS_REVIEW: { label: 'Needs Review', className: 'status-needs-review' },
  ASSIGNED: { label: 'Assigned', className: 'status-assigned' },
  EN_ROUTE: { label: 'En Route', className: 'status-en-route' },
  ON_SITE: { label: 'On Site', className: 'status-on-site' },
  RESOLVED_PENDING_VERIFICATION: { label: 'Pending Verification', className: 'status-assigned' },
  RESOLVED: { label: 'Resolved', className: 'status-resolved' },
  REOPENED: { label: 'Reopened', className: 'status-reopened' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'status-open' };
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
