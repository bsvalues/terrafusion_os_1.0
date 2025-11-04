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
import { Shield, Fingerprint, Lock, Clock, Key, Plus, X  } from '@mui/icons-material';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Define schema for security setup
const securitySetupSchema = z.object({
  requireMFA: z.boolean(),
  sessionTimeout: z.number().min(5).max(1440), // Minutes (5 min to 24 hours)
  passwordPolicy: z.enum(['basic', 'standard', 'strict']),
  ipWhitelist: z.array(z.string().ip().or(z.string().regex(/^[\d.]+\/\d{1,2}$/)))
});

type SecuritySetupValues = z.infer<typeof securitySetupSchema>;

interface SecuritySetupStepProps {
  values: SecuritySetupValues;
  onChange: (values: Partial<SecuritySetupValues>) => void;
  onValidation: (isValid: boolean) => void;
}

const SecuritySetupStep: React.FC<SecuritySetupStepProps> = ({ 
  values, 
  onChange, 
  onValidation 
}) => {
  const [newIpAddress, setNewIpAddress] = useState('');
  const [ipError, setIpError] = useState('');

  const form = useForm<SecuritySetupValues>({
    resolver: zodResolver(securitySetupSchema),
    defaultValues: values,
    mode: 'onChange'
  });

  // Watch for form validity changes
  const { formState } = form;
  
  useEffect(() => {
    onValidation(formState.isValid);
  }, [formState.isValid, onValidation]);

  // Handle form value changes
  const handleFormChange = (name: keyof SecuritySetupValues, value: any) => {
    onChange({ [name]: value });
    form.setValue(name, value);
  };

  // Handle adding IP address to whitelist
  const handleAddIpAddress = () => {
    // Simple IP validation (could be more robust)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(newIpAddress)) {
      setIpError('Please enter a valid IP address or CIDR notation (e.g., 192.168.1.1 or 192.168.1.0/24)');
      return;
    }

    setIpError('');
    const currentWhitelist = form.getValues('ipWhitelist') || [];
    const updatedWhitelist = [...currentWhitelist, newIpAddress];
    handleFormChange('ipWhitelist', updatedWhitelist);
    setNewIpAddress('');
  };

  // Handle removing IP address from whitelist
  const handleRemoveIpAddress = (ip: string) => {
    const currentWhitelist = form.getValues('ipWhitelist') || [];
    const updatedWhitelist = currentWhitelist.filter(address => address !== ip);
    handleFormChange('ipWhitelist', updatedWhitelist);
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Shield className="h-6 w-6 mr-2 text-primary" />
        <h2 className="text-xl font-semibold">Security Configuration</h2>
      </div><>

      
      <p className="text-muted-foreground mb-6">
        Configure security settings to protect your application and data from unauthorized access.
      </p>

      <Form
</> {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="requireMFA"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Fingerprint className="h-5 w-5 mr-2 text-primary" />
                    <FormLabel className="text-base">
                      Require Multi-Factor Authentication
                    </FormLabel>
                  </div>
                  <FormDescription>
                    Require users to verify their identity using a second factor when logging in
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(value) => {
                      field.onChange(value);
                      handleFormChange('requireMFA', value);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sessionTimeout"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><>

                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  Session Timeout: {field.value} minutes
                </FormLabel>
                <FormControl
</>><>

                  <Slider
                    value={[field.value]}
                    min={5}
                    max={1440}
                    step={5}
                    onValueChange={(value) => {
                      field.onChange(value[0]);
                      handleFormChange('sessionTimeout', value[0]);
                    }}
                  />
                </FormControl>
                <FormDescription
</>>
                  Automatically log out inactive users after the specified time period (5 minutes to 24 hours)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordPolicy"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="flex items-center mb-2"><>

                  <Lock className="h-4 w-4 mr-2 text-primary" />
                  Password Policy
                </FormLabel>
                <FormControl
</>>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFormChange('passwordPolicy', value);
                    }}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-primary cursor-pointer bg-popover transition-all hover:shadow-md">
                      <RadioGroupItem value="basic" id="basic" className="sr-only" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mb-2"><>

                        <Lock className="h-4 w-4" />
                      </div>
                      <Label
</> htmlFor="basic" className="font-medium">Basic</Label>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Minimum 8 characters
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-primary cursor-pointer bg-popover transition-all hover:shadow-md">
                      <RadioGroupItem value="standard" id="standard" className="sr-only" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 mb-2"><>

                        <Lock className="h-4 w-4" />
                      </div>
                      <Label
</> htmlFor="standard" className="font-medium">Standard</Label>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        8+ chars with letters, numbers
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-primary cursor-pointer bg-popover transition-all hover:shadow-md">
                      <RadioGroupItem value="strict" id="strict" className="sr-only" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mb-2"><>

                        <Lock className="h-4 w-4" />
                      </div>
                      <Label
</> htmlFor="strict" className="font-medium">Strict</Label>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        12+ chars with uppercase, lowercase, numbers, symbols
                      </p>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ipWhitelist"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><>

                  <Key className="h-4 w-4 mr-2 text-primary" />
                  IP Address Whitelist
                </FormLabel>
                <FormDescription
</> className="mb-2">
                  Restrict access to specific IP addresses or ranges (leave empty to allow all IPs)
                </FormDescription>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter IP address or range (e.g., 192.168.1.1 or 192.168.0.0/24)" 
                      value={newIpAddress}
                      onChange={(e) => setNewIpAddress(e.target.value)}
                      className="flex-grow"
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddIpAddress}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  
                  {ipError && <p className="text-sm text-red-500">{ipError}</p>}
                  
                  <div className="flex flex-wrap gap-2">
                    {field.value.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No IP restrictions (all IPs allowed)</p>
                    )}
                    {field.value.map(ip => (
                      <Badge key={ip} variant="secondary" className="flex items-center gap-1 pl-2">
                        {ip}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleRemoveIpAddress(ip)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>

      <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-md"><>

        <h3 className="font-semibold mb-2">💡 Pro Tip</h3>
        <p
</> className="text-sm">
          For optimal security, we recommend enabling MFA, setting a reasonable session timeout (30-60 minutes), 
          and using the standard or strict password policy. IP whitelisting is recommended for admin accounts 
          or when your system is accessed from predictable locations.
        </p>
      </div>
    </div>
  );
};

export default SecuritySetupStep;