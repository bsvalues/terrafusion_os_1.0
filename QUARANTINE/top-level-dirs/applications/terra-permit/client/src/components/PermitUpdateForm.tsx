import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Permit } from '@/types';
import { usePermitUpdates } from '@/hooks/use-permit-updates'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

interface PermitUpdateFormProps {
  permit: Permit;
  sessionId: string;
  onUpdateComplete?: () => void;
}

const permitUpdateSchema = z.object({
  parcelNumber: z.string().min(1, 'Parcel number is required'),
  neighborhoodCode: z.string().optional(),
  permitDescription: z.string().optional(),
  value: z.string().optional(),
  issueDate: z.string().optional(),
  enterPermit: z.boolean(),
  reason: z.string().optional(),
});

type PermitUpdateFormValues = z.infer<typeof permitUpdateSchema>;

export function PermitUpdateForm({ permit, sessionId, onUpdateComplete }: PermitUpdateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updatePermitWithNotification } = usePermitUpdates();
  const { toast } = useToast();
  const userNickname = `User-${Math.random().toString(36).substring(2, 7)}`;

  const form = useForm<PermitUpdateFormValues>({
    resolver: zodResolver(permitUpdateSchema),
    defaultValues: {
      parcelNumber: permit.parcelNumber,
      neighborhoodCode: permit.neighborhoodCode || '',
      permitDescription: permit.permitDescription || '',
      value: permit.value || '',
      issueDate: permit.issueDate || '',
      enterPermit: permit.enterPermit,
      reason: permit.reason || '',
    },
  });

  async function onSubmit(data: PermitUpdateFormValues) {
    try {
      setIsSubmitting(true);
      
      // Find what changed
      const changes: Partial<Permit> = {};
      Object.keys(data).forEach(key => {
        const k = key as keyof PermitUpdateFormValues;
        if (data[k] !== permit[k as keyof Permit]) {
          changes[k as keyof Permit] = data[k] as any;
        }
      });
      
      // Only update if something changed
      if (Object.keys(changes).length === 0) {
        toast({
          title: "No changes detected",
          description: "No changes were made to the permit.",
          variant: "default",
        });
        return;
      }
      
      // Create a detailed description of what changed
      const changeDescriptions = Object.keys(changes).map(key => {
        const fieldName = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        
        // Format based on the type of field
        if (key === 'enterPermit') {
          return `${fieldName} changed to ${changes.enterPermit ? 'Enter' : 'Skip'}`;
        } else if (key === 'reason') {
          return `reason updated`;
        } else {
          // For text fields, include the new value if it's not too long
          const oldValue = permit[key as keyof Permit];
          const newValue = changes[key as keyof typeof changes];
          
          // Show truncated values for short text fields
          if (typeof newValue === 'string' && newValue.length < 30) {
            return `${fieldName} changed from "${oldValue}" to "${newValue}"`;
          }
          return `${fieldName} updated`;
        }
      });
      
      const actionDetail = `Manual update: ${changeDescriptions.join(', ')}`;
      
      // Get current authenticated user ID
      // TODO: In a real application, get this from auth context instead of hardcoding
      const currentUserId = 1;
      
      // Update with notification
      await updatePermitWithNotification(
        permit.id,
        changes,
        currentUserId,
        sessionId,
        userNickname,
        actionDetail
      );
      
      toast({
        title: "Permit updated",
        description: "The permit was successfully updated and history recorded.",
        variant: "default",
      });
      
      if (onUpdateComplete) {
        onUpdateComplete();
      }
    } catch (error) {
      console.error('Error updating permit:', error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update permit",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Permit</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="parcelNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcel Number</FormLabel>
                  <FormControl
>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="neighborhoodCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neighborhood Code</FormLabel>
                    <FormControl
>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl
>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="permitDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permit Description</FormLabel>
                  <FormControl
>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl
>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enterPermit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enter Permit</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl
>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Permit'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}