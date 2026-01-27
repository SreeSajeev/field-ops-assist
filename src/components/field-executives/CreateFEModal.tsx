/**
 * CreateFEModal.tsx
 * 
 * Modal component for Service Staff to create new Field Executives.
 * Creates records in the existing field_executives table.
 * 
 * Part of Requirement 4: Service Staff Ability to Create Field Executives
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, UserPlus, X } from 'lucide-react';
import { CreateFESchema, formatZodError } from '@/lib/validation';
import { z } from 'zod';

interface CreateFEModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Predefined skill categories for logistics domain
const SKILL_OPTIONS = [
  'Delivery',
  'Pickup',
  'Installation',
  'Maintenance',
  'Repair',
  'Documentation',
  'Heavy Vehicles',
  'Light Vehicles',
  'Hazmat',
  'Cold Chain',
  'Express',
  'Last Mile',
];

export function CreateFEModal({ open, onOpenChange }: CreateFEModalProps) {
  const queryClient = useQueryClient();
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [baseLocation, setBaseLocation] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Toggle a skill selection
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  // Mutation to create the FE with validation
  const createFEMutation = useMutation({
    mutationFn: async () => {
      // Validate input using Zod schema
      const validated = CreateFESchema.parse({
        name: name.trim(),
        phone: phone.trim() || null,
        base_location: baseLocation.trim() || null,
        skills: selectedSkills.length > 0 ? { categories: selectedSkills } : null,
        active: isActive,
      });
      
      const { data, error } = await supabase
        .from('field_executives')
        .insert({
          name: validated.name,
          phone: validated.phone,
          base_location: validated.base_location,
          skills: validated.skills,
          active: validated.active,
        })
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await supabase.from('audit_logs').insert({
        entity_type: 'field_executive',
        entity_id: data.id,
        action: 'field_executive_created',
        metadata: {
          name: data.name,
          base_location: data.base_location,
        },
      });

      return data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh FE lists
      queryClient.invalidateQueries({ queryKey: ['field-executives'] });
      queryClient.invalidateQueries({ queryKey: ['field-executives-with-stats'] });
      
      toast({
        title: 'Field Executive Created',
        description: `${data.name} has been added and is now available for ticket assignment.`,
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
        title: 'Failed to Create Field Executive',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setBaseLocation('');
    setSelectedSkills([]);
    setIsActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter the field executive\'s name.',
        variant: 'destructive',
      });
      return;
    }
    
    createFEMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Field Executive
          </DialogTitle>
          <DialogDescription>
            Create a new Field Executive profile. They will be available for 
            ticket assignment immediately after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="feName">Full Name *</Label>
            <Input
              id="feName"
              placeholder="e.g., Rajesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="fePhone">Phone Number</Label>
            <Input
              id="fePhone"
              placeholder="e.g., +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
          </div>

          {/* Base Location */}
          <div className="space-y-2">
            <Label htmlFor="feLocation">Base Location</Label>
            <Input
              id="feLocation"
              placeholder="e.g., Mumbai, Andheri"
              value={baseLocation}
              onChange={(e) => setBaseLocation(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used for location-based ticket assignment recommendations
            </p>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills & Expertise</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
              {SKILL_OPTIONS.map((skill) => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                  className="cursor-pointer select-none transition-colors"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  {selectedSkills.includes(skill) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedSkills.length} skill(s) selected
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="feActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="feActive" className="text-sm font-normal cursor-pointer">
              Active and available for assignments
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createFEMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createFEMutation.isPending}>
              {createFEMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Field Executive
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
