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
import { Database, Server, HardDrive  } from '@mui/icons-material';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Define the form schema for the database setup step
const databaseSetupSchema = z.object({
  connectionType: z.enum(['local', 'remote']),
  enableBackups: z.boolean(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  retentionPeriod: z.number().min(1).max(365)
});

type DatabaseSetupValues = z.infer<typeof databaseSetupSchema>;

interface DatabaseSetupStepProps {
  values: DatabaseSetupValues;
  onChange: (values: Partial<DatabaseSetupValues>) => void;
  onValidation: (isValid: boolean) => void;
}

const DatabaseSetupStep: React.FC<DatabaseSetupStepProps> = ({ 
  values, 
  onChange, 
  onValidation 
}) => {
  const form = useForm<DatabaseSetupValues>({
    resolver: zodResolver(databaseSetupSchema),
    defaultValues: values,
    mode: 'onChange'
  });

  // Watch for form validity changes
  const { formState } = form;
  
  useEffect(() => {
    onValidation(formState.isValid);
  }, [formState.isValid, onValidation]);

  // Handle form value changes
  const handleFormChange = (name: keyof DatabaseSetupValues, value: any) => {
    onChange({ [name]: value });
    form.setValue(name, value);
  };

  // Watch connection type to show appropriate configuration options
  const connectionType = form.watch('connectionType');
  const enableBackups = form.watch('enableBackups');

  return (
    <div>
      <div className="flex items-center mb-6">
        <Database className="h-6 w-6 mr-2 text-primary" />
        <h2 className="text-xl font-semibold">Database Configuration</h2>
      </div><>

      
      <p className="text-muted-foreground mb-6">
        Configure how the system interacts with the database, including connection settings and backup preferences.
      </p>

      <Form
</> {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="connectionType"
            render={({ field }) => (
              <FormItem className="space-y-4"><>

                <FormLabel>Database Connection Type</FormLabel>
                <FormControl
</>>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFormChange('connectionType', value);
                    }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-primary cursor-pointer bg-popover transition-all hover:shadow-md">
                      <RadioGroupItem value="local" id="local" className="sr-only" />
                      <HardDrive className="h-6 w-6 mb-3 text-primary" /><>

                      <Label htmlFor="local" className="font-medium">Local Database</Label>
                      <p
</> className="text-xs text-center text-muted-foreground mt-2">
                        Use the built-in database for single-user or development environments
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-primary cursor-pointer bg-popover transition-all hover:shadow-md">
                      <RadioGroupItem value="remote" id="remote" className="sr-only" />
                      <Server className="h-6 w-6 mb-3 text-primary" /><>

                      <Label htmlFor="remote" className="font-medium">Remote Database</Label>
                      <p
</> className="text-xs text-center text-muted-foreground mt-2">
                        Connect to a remote database server for production or multi-user environments
                      </p>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {connectionType === 'remote' && (
            <div className="p-4 bg-muted rounded-md space-y-4"><>

              <h3 className="font-medium">Remote Database Information</h3>
              <p
</> className="text-sm text-muted-foreground">
                Your application is automatically configured to use the database URL 
                specified in the environment variables. To modify this connection, update
                the DATABASE_URL environment variable.
              </p>
              <div className="p-2 bg-black text-white rounded font-mono text-xs">
                <code>DATABASE_URL=postgresql://username:password@hostname:port/database</code>
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="enableBackups"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5"><>

                  <FormLabel className="text-base">
                    Enable Automated Backups
                  </FormLabel>
                  <FormDescription
</>>
                    Regularly backup your database to prevent data loss
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(value) => {
                      field.onChange(value);
                      handleFormChange('enableBackups', value);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {enableBackups && (
            <>
              <FormField
                control={form.control}
                name="backupFrequency"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Backup Frequency</FormLabel>
                    <Select
</>
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleFormChange('backupFrequency', value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select backup frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent><>

                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem
</> value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select><>

                    <FormDescription>
                      How often should the system create backups
                    </FormDescription>
                    <FormMessage
</> />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="retentionPeriod"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Retention Period (Days)</FormLabel>
                    <FormControl
</>><>

                      <Input
                        type="number"
                        min={1}
                        max={365}
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                          handleFormChange('retentionPeriod', value);
                        }}
                      />
                    </FormControl>
                    <FormDescription
</>>
                      How long backup files should be kept before automatic deletion (1-365 days)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
      </Form>

      <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-md"><>

        <h3 className="font-semibold mb-2">💡 Pro Tip</h3>
        <p
</> className="text-sm">
          For production environments, we recommend using a remote database with daily backups 
          and a retention period of at least 30 days to ensure data safety and availability.
        </p>
      </div>
    </div>
  );
};

export default DatabaseSetupStep;