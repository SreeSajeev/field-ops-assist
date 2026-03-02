import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TicketFilters, TicketStatus } from '@/lib/types';

interface TicketFiltersBarProps {
  filters: TicketFilters;
  onFiltersChange: (filters: TicketFilters) => void;
}

const statusOptions: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'NEEDS_REVIEW', label: 'Needs Review' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'EN_ROUTE', label: 'En Route' },
  { value: 'ON_SITE', label: 'On Site' },
  { value: 'RESOLVED_PENDING_VERIFICATION', label: 'Pending Verification' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REOPENED', label: 'Reopened' },
];

const confidenceOptions = [
  { value: 'all', label: 'All Confidence' },
  { value: 'high', label: 'High (≥95%)' },
  { value: 'medium', label: 'Medium (80-94%)' },
  { value: 'low', label: 'Low (<80%)' },
];

export function TicketFiltersBar({ filters, onFiltersChange }: TicketFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, status: value as TicketStatus | 'all' })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Confidence filter */}
      <Select
        value={filters.confidenceRange || 'all'}
        onValueChange={(value) => 
          onFiltersChange({ 
            ...filters, 
            confidenceRange: value as 'high' | 'medium' | 'low' | 'all' 
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Confidence" />
        </SelectTrigger>
        <SelectContent>
          {confidenceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
