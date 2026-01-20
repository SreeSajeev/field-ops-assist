/**
 * CreateTicketModal.tsx
 * 
 * Modal component for Service Staff to manually create tickets.
 * This creates tickets in the same tickets table as email-generated tickets,
 * but with source set to 'MANUAL' to distinguish them.
 * 
 * Part of Requirement 1: Manual Ticket Creation by Service Staff
 */

import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Ticket } from 'lucide-react';

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Common ticket categories based on logistics CRM domain
const CATEGORIES = [
  'Delivery Issue',
  'Vehicle Breakdown',
  'Documentation',
  'Customer Complaint',
  'Damage Report',
  'Schedule Change',
  'Other',
];

// Common issue types
const ISSUE_TYPES = [
  'Delayed Delivery',
  'Missing Package',
  'Wrong Address',
  'Vehicle Maintenance',
  'Flat Tire',
  'Engine Issue',
  'Missing Documents',
  'Incorrect Invoice',
  'Damaged Goods',
  'Lost Shipment',
  'Route Change',
  'Other',
];

export function CreateTicketModal({ open, onOpenChange }: CreateTicketModalProps) {
  const queryClient = useQueryClient();
  
  // Form state
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [category, setCategory] = useState('');
  const [issueType, setIssueType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [complaintId, setComplaintId] = useState('');

  // Generate a unique ticket number
  const generateTicketNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  };

  // Mutation to create the ticket
  const createTicketMutation = useMutation({
    mutationFn: async () => {
      const ticketNumber = generateTicketNumber();
      
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ticket_number: ticketNumber,
          vehicle_number: vehicleNumber || null,
          category: category || null,
          issue_type: issueType || null,
          location: location || null,
          complaint_id: complaintId || null,
          status: 'OPEN',
          source: 'MANUAL', // Distinguish from email-generated tickets
          needs_review: false, // Manual tickets don't need AI review
          confidence_score: 100, // Manual entry = 100% confidence
          opened_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial comment with description if provided
      if (description.trim()) {
        await supabase.from('ticket_comments').insert({
          ticket_id: data.id,
          body: description,
          source: 'STAFF',
        });
      }

      // Log to audit
      await supabase.from('audit_logs').insert({
        entity_type: 'ticket',
        entity_id: data.id,
        action: 'manual_ticket_created',
        metadata: {
          ticket_number: ticketNumber,
          source: 'MANUAL',
        },
      });

      return data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh ticket list
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast({
        title: 'Ticket Created Successfully',
        description: `Ticket ${data.ticket_number} has been created and is now open.`,
      });
      
      // Reset form and close modal
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Ticket',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setVehicleNumber('');
    setCategory('');
    setIssueType('');
    setLocation('');
    setDescription('');
    setComplaintId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation: at least category or issue type should be provided
    if (!category && !issueType) {
      toast({
        title: 'Missing Information',
        description: 'Please select at least a category or issue type.',
        variant: 'destructive',
      });
      return;
    }
    
    createTicketMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Create New Ticket
          </DialogTitle>
          <DialogDescription>
            Manually create a service ticket. This ticket will be treated the same as 
            email-generated tickets and can be assigned to Field Executives.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Optional: Complaint/Reference ID */}
          <div className="space-y-2">
            <Label htmlFor="complaintId">Reference ID (Optional)</Label>
            <Input
              id="complaintId"
              placeholder="e.g., COMP-12345"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
            />
          </div>

          {/* Vehicle Number */}
          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">Vehicle Number (Optional)</Label>
            <Input
              id="vehicleNumber"
              placeholder="e.g., MH-12-AB-1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="issueType">Issue Type *</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger id="issueType">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Mumbai, Andheri East"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide additional details about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTicketMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTicketMutation.isPending}>
              {createTicketMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
