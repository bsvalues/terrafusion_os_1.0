import React, { useState, useEffect } from 'react';
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Settings } from 'lucide-react';

// Define the form schema for the general setup step
const generalSetupSchema = z.object({
  applicationName: z.string().min(3, 'Application name must be at least 3 characters'),
  defaultTheme: z.enum(['light', 'dark', 'system']),
  defaultView: z.string(),
  enableNotifications: z.boolean()
});

type GeneralSetupValues = z.infer<typeof generalSetupSchema>;

interface GeneralSetupStepProps {
  values: GeneralSetupValues;
  onChange: (values: Partial<GeneralSetupValues>) => void;
  onValidation: (isValid: boolean) => void;
}

const GeneralSetupStep: React.FC<GeneralSetupStepProps> = ({ 
  values, 
  onChange, 
  onValidation 
}) => {
  const form = useForm<GeneralSetupValues>({
    resolver: zodResolver(generalSetupSchema),
    defaultValues: values,
    mode: 'onChange'
  });

  // Watch for form validity changes
  const { formState } = form;
  
  useEffect(() => {
    onValidation(formState.isValid);
  }, [formState.isValid, onValidation]);

  // Handle form value changes
  const handleFormChange = (name: keyof GeneralSetupValues, value: any) => {
    onChange({ [name]: value });
    form.setValue(name, value);
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Settings className="h-6 w-6 mr-2 text-primary" />
        <h2 className="text-xl font-semibold">General System Setup</h2>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Configure the basic settings for your application. These settings affect the overall
        appearance and behavior of the system.
      </p>

      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="applicationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application Name</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleFormChange('applicationName', e.target.value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  This name will be displayed in the browser title and throughout the application.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defaultTheme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Theme</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFormChange('defaultTheme', value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the default theme for the application interface.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defaultView"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Landing Page</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFormChange('defaultView', value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a default view" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="reports">Reports</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose which page users will see first after logging in.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enableNotifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Enable Notifications
                  </FormLabel>
                  <FormDescription>
                    Receive system notifications for important events and updates.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(value) => {
                      field.onChange(value);
                      handleFormChange('enableNotifications', value);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </Form>

      <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-md">
        <h3 className="font-semibold mb-2">💡 Pro Tip</h3>
        <p className="text-sm">
          Your application name will be visible to all users of the system. Choose a name that's 
          descriptive and easily recognizable for your organization.
        </p>
      </div>
    </div>
  );
};

export default GeneralSetupStep;