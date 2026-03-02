/**
 * CreateTicketModal.tsx
 * 
 * Modal component for Service Manager to manually create tickets.
 * This creates tickets in the same tickets table as email-generated tickets,
 * but with source set to 'MANUAL' to distinguish them.
 * 
 * Part of Requirement 1: Manual Ticket Creation by Service Manager
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
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Ticket, Star } from 'lucide-react';
import { CreateTicketSchema, CommentSchema, formatZodError } from '@/lib/validation';
import { z } from 'zod';
import { COMPLAINT_CATEGORIES, ISSUE_TYPES } from '@/constants/complaintCategories';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

export interface ClientTicketContext {
  openedByEmail: string;
  clientSlug: string;
}

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, ticket is created as client-originated: opened_by_email and client_slug are set; priority control is hidden. */
  clientContext?: ClientTicketContext | null;
}

export function CreateTicketModal({ open, onOpenChange, clientContext }: CreateTicketModalProps) {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const isClientMode = !!clientContext;

  // Form state
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [category, setCategory] = useState('');
  const [issueType, setIssueType] = useState('');
  const [customIssueType, setCustomIssueType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [complaintId, setComplaintId] = useState('');
  const [priority, setPriority] = useState(false);

  // When "Other" is selected, use custom text if provided; otherwise send "Other"
  const effectiveIssueType =
    issueType === 'Other' && customIssueType.trim()
      ? customIssueType.trim()
      : issueType || null;

  // Generate a unique ticket number
  const generateTicketNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  };

  // Mutation to create the ticket with validation
  const createTicketMutation = useMutation({
    mutationFn: async () => {
      const ticketNumber = generateTicketNumber();
      
      // Validate ticket data using Zod schema
      const validatedTicket = CreateTicketSchema.parse({
        ticket_number: ticketNumber,
        vehicle_number: vehicleNumber.trim() || null,
        category: category || null,
        issue_type: effectiveIssueType,
        location: location.trim() || null,
        complaint_id: complaintId.trim() || null,
        source: 'MANUAL',
        needs_review: false,
        confidence_score: 100,
        priority,
      });

      type TicketInsert = Database['public']['Tables']['tickets']['Insert'] & {
        client_slug?: string;
        organisation_id?: string;
      };
      const insertPayload: TicketInsert = {
        ticket_number: validatedTicket.ticket_number,
        vehicle_number: validatedTicket.vehicle_number,
        category: validatedTicket.category,
        issue_type: validatedTicket.issue_type,
        location: validatedTicket.location,
        complaint_id: validatedTicket.complaint_id,
        source: validatedTicket.source,
        needs_review: validatedTicket.needs_review,
        confidence_score: validatedTicket.confidence_score,
        priority: validatedTicket.priority,
        status: 'OPEN',
        opened_at: new Date().toISOString(),
        ...(clientContext
          ? {
              opened_by_email: clientContext.openedByEmail,
              client_slug: clientContext.clientSlug,
            }
          : {}),
        ...(userProfile?.organisation_id ? { organisation_id: userProfile.organisation_id } : {}),
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      // Add initial comment with description if provided
      if (description.trim()) {
        // Validate comment
        const validatedComment = CommentSchema.parse({
          ticketId: data.id,
          body: description.trim(),
          source: 'STAFF',
        });
        
        await supabase.from('ticket_comments').insert({
          ticket_id: validatedComment.ticketId,
          body: validatedComment.body,
          source: validatedComment.source,
        });
      }

      // Log to audit
      await supabase.from('audit_logs').insert({
        entity_type: 'ticket',
        entity_id: data.id,
        action: clientContext ? 'client_ticket_created' : 'manual_ticket_created',
        metadata: {
          ticket_number: ticketNumber,
          source: 'MANUAL',
          ...(clientContext ? { client_slug: clientContext.clientSlug } : {}),
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
      // Handle validation errors specifically
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: formatZodError(error),
          variant: 'destructive',
        });
        return;
      }
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
    setCustomIssueType('');
    setLocation('');
    setDescription('');
    setComplaintId('');
    setPriority(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation: at least category or issue type should be provided (unchanged)
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
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            {isClientMode ? 'Submit support request' : 'Create New Ticket'}
          </DialogTitle>
          <DialogDescription>
            {isClientMode
              ? 'Describe your issue below. Our team will review and assign a technician as needed.'
              : 'Manually create a service ticket. This ticket will be treated the same as email-generated tickets and can be assigned to Field Executives.'}
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
              className="w-full"
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
              className="w-full font-mono"
            />
          </div>

          {/* Category — structured list from constants, "Other" at bottom */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Issue Type — dropdown with custom entry when "Other" selected */}
          <div className="space-y-2">
            <Label htmlFor="issueType">Issue Type *</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger id="issueType" className="w-full">
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
            {issueType === 'Other' && (
              <Input
                id="customIssueType"
                placeholder="Specify issue type (optional)"
                value={customIssueType}
                onChange={(e) => setCustomIssueType(e.target.value)}
                className="mt-1.5 w-full"
              />
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Mumbai, Andheri East"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Priority (Service Manager only; clients cannot set SLA/priority) */}
          {!isClientMode && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="priority"
                checked={priority}
                onCheckedChange={(checked) => setPriority(checked === true)}
                aria-label="Mark as priority"
              />
              <Label
                htmlFor="priority"
                className="flex items-center gap-1.5 text-sm font-medium cursor-pointer"
              >
                <span className="inline-flex rounded-full ring-2 ring-yellow-300/50 p-0.5" aria-hidden>
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                </span>
                Mark as priority
              </Label>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide additional details about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full"
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
                  {isClientMode ? 'Submitting...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {isClientMode ? 'Submit request' : 'Create Ticket'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
