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
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Bot, Key, CheckCircle, AlertCircle  } from '@mui/icons-material';

// Define the form schema for the AI setup step
const aiSetupSchema = z.object({
  apiKeyConfigured: z.boolean(),
  aiModel: z.string(),
  enableContentFiltering: z.boolean(),
  enableRateLimiting: z.boolean(),
  maxRequestsPerMinute: z.number().min(1).max(300)
});

type AISetupValues = z.infer<typeof aiSetupSchema>;

interface AISetupStepProps {
  values: AISetupValues;
  onChange: (values: Partial<AISetupValues>) => void;
  onValidation: (isValid: boolean) => void;
}

const AISetupStep: React.FC<AISetupStepProps> = ({ 
  values, 
  onChange, 
  onValidation 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!values.apiKeyConfigured);

  const form = useForm<AISetupValues>({
    resolver: zodResolver(aiSetupSchema),
    defaultValues: values,
    mode: 'onChange'
  });

  // Watch for form validity changes
  const { formState } = form;
  
  useEffect(() => {
    onValidation(formState.isValid);
  }, [formState.isValid, onValidation]);

  // Handle form value changes
  const handleFormChange = (name: keyof AISetupValues, value: any) => {
    onChange({ [name]: value });
    form.setValue(name, value);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleSaveApiKey = () => {
    // In a real implementation, you would make an API call to save the key securely
    if (apiKey.trim().length > 0) {
      handleFormChange('apiKeyConfigured', true);
      setShowApiKeyInput(false);
      setApiKey('');
    }
  };

  const handleChangeApiKey = () => {
    setShowApiKeyInput(true);
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Bot className="h-6 w-6 mr-2 text-primary" />
        <h2 className="text-xl font-semibold">AI Configuration</h2>
      </div><>

      
      <p className="text-muted-foreground mb-6">
        Configure how the AI components of the system operate. These settings affect the behavior
        and capabilities of AI-powered features.
      </p>

      <div
</> className="mb-8 border-2 border-primary/10 p-4 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Key className="h-5 w-5 mr-2 text-primary" />
            <h3 className="text-lg font-medium">OpenAI API Key Configuration</h3>
          </div>
          
          {values.apiKeyConfigured && !showApiKeyInput ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-1" /> Configured
            </div>
          ) : (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="h-5 w-5 mr-1" /> Not Configured
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          The OpenAI API key is required for AI-powered features like maintenance recommendations, 
          context-aware responses, and intelligent classification.
        </p>
        
        {showApiKeyInput ? (
          <div className="space-y-2">
            <Input 
              type="password" 
              placeholder="sk-..." 
              value={apiKey}
              onChange={handleApiKeyChange}
              className="font-mono"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Don't have an API key? <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get one from OpenAI</a>
              </p>
              <button 
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim()}
                className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Save Key
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleChangeApiKey}
            className="text-sm text-primary hover:underline"
          >
            Change API Key
          </button>
        )}
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="aiModel"
            render={({ field }) => (
              <FormItem><>

                <FormLabel>AI Model</FormLabel>
                <Select
</>
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFormChange('aiModel', value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an AI model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent><>

                    <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                    <SelectItem
</> value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select><>

                <FormDescription>
                  Select which OpenAI model to use for AI features. More advanced models provide better results but may be more expensive.
                </FormDescription>
                <FormMessage
</> />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enableContentFiltering"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5"><>

                  <FormLabel className="text-base">
                    Content Filtering
                  </FormLabel>
                  <FormDescription
</>>
                    Filter inappropriate content from AI responses
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(value) => {
                      field.onChange(value);
                      handleFormChange('enableContentFiltering', value);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enableRateLimiting"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5"><>

                  <FormLabel className="text-base">
                    Rate Limiting
                  </FormLabel>
                  <FormDescription
</>>
                    Limit AI requests to prevent excessive API usage
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(value) => {
                      field.onChange(value);
                      handleFormChange('enableRateLimiting', value);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch('enableRateLimiting') && (
            <FormField
              control={form.control}
              name="maxRequestsPerMinute"
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Maximum Requests Per Minute: {field.value}</FormLabel>
                  <FormControl
</>><>

                    <Slider
                      value={[field.value]}
                      min={1}
                      max={300}
                      step={1}
                      onValueChange={(value) => {
                        field.onChange(value[0]);
                        handleFormChange('maxRequestsPerMinute', value[0]);
                      }}
                    />
                  </FormControl>
                  <FormDescription
</>>
                    Limit the number of AI requests that can be made per minute to control costs.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </Form>

      <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-md"><>

        <h3 className="font-semibold mb-2">💡 Pro Tip</h3>
        <p
</> className="text-sm">
          GPT-4o is the recommended model for its balance of performance and cost. For most use cases, 
          it provides excellent results while being more efficient than the standard GPT-4 model.
        </p>
      </div>
    </div>
  );
};

export default AISetupStep;