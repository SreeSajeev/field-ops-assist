/**
 * EditFEModal.tsx
 * Edit Field Executive details. Respects organisation scoping:
 * SuperAdmin can edit any FE; Admin/Service Manager only FEs in their org.
 */

import { useState, useEffect } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2, Pencil } from 'lucide-react';
import { CreateFESchema, formatZodError } from '@/lib/validation';
import { z } from 'zod';
import { FieldExecutive } from '@/lib/types';

const SKILL_OPTIONS = [
  'Delivery', 'Pickup', 'Installation', 'Maintenance', 'Repair', 'Documentation',
  'Heavy Vehicles', 'Light Vehicles', 'Hazmat', 'Cold Chain', 'Express', 'Last Mile',
];

interface EditFEModalProps {
  executive: FieldExecutive | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditFEModal({ executive, open, onOpenChange, onSuccess }: EditFEModalProps) {
  const queryClient = useQueryClient();
  const { userProfile, organisationId } = useAuth();
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [baseLocation, setBaseLocation] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (executive && open) {
      setName(executive.name ?? '');
      setPhone(executive.phone ?? '');
      setBaseLocation(executive.base_location ?? '');
      const skills = executive.skills as { categories?: string[] } | null;
      setSelectedSkills(skills?.categories ?? []);
      setIsActive(executive.active ?? true);
    }
  }, [executive, open]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const updateFEMutation = useMutation({
    mutationFn: async () => {
      if (!executive) throw new Error('No executive selected');
      if (!isSuperAdmin && organisationId) {
        const feOrgId = executive.organisation_id ?? null;
        if (feOrgId !== organisationId) {
          throw new Error('You can only edit field executives in your organisation.');
        }
      }
      const validated = CreateFESchema.parse({
        name: name.trim(),
        phone: phone.trim() || null,
        base_location: baseLocation.trim() || null,
        skills: selectedSkills.length > 0 ? { categories: selectedSkills } : null,
        active: isActive,
      });
      const { error } = await supabase
        .from('field_executives')
        .update({
          name: validated.name,
          phone: validated.phone,
          base_location: validated.base_location,
          skills: validated.skills,
          active: validated.active,
        })
        .eq('id', executive.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-executives'] });
      queryClient.invalidateQueries({ queryKey: ['field-executives-with-stats'] });
      toast({ title: 'Field Executive updated' });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: Error) => {
      if (err instanceof z.ZodError) {
        toast({ title: 'Validation failed', description: formatZodError(err), variant: 'destructive' });
      } else {
        toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
      }
    },
  });

  const canEdit = executive && (
    isSuperAdmin ||
    (organisationId && (executive.organisation_id ?? null) === organisationId)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit Field Executive
          </DialogTitle>
          <DialogDescription>
            Update name, contact, location, skills, and status. Changes are saved to this organisation only.
          </DialogDescription>
        </DialogHeader>
        {executive && !canEdit && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            You can only edit field executives in your organisation.
          </div>
        )}
        {executive && canEdit && (
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-fe-name">Name</Label>
              <Input
                id="edit-fe-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-fe-phone">Phone</Label>
              <Input
                id="edit-fe-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-fe-location">Base Location</Label>
              <Input
                id="edit-fe-location"
                value={baseLocation}
                onChange={(e) => setBaseLocation(e.target.value)}
                placeholder="Base location"
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="edit-fe-active" checked={isActive} onCheckedChange={(c) => setIsActive(!!c)} />
              <Label htmlFor="edit-fe-active">Active</Label>
            </div>
            <div className="grid gap-2">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {canEdit && (
            <Button
              disabled={updateFEMutation.isPending || !name.trim()}
              onClick={() => updateFEMutation.mutate()}
            >
              {updateFEMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
