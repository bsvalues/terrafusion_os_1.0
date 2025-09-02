import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Loader2, AlertCircle, CheckCircle2  } from '@mui/icons-material';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IllustratedTooltip } from '@/components/ui/illustrated-tooltip';
import { illustrations } from '@/lib/illustrations';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define template interface
interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  requiredParameters: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'date' | 'select';
      label: string;
      description?: string;
      required: boolean;
      options?: { value: string; label: string }[];
      defaultValue?: any;
    };
  };
}

// Generate form schema from template selections
const generatorFormSchema = z.object({
  templateId: z.number({
    required_error: "Please select a report template",
  }),
  name: z.string()
    .min(3, "Report name must be at least 3 characters")
    .max(100, "Report name must be at most 100 characters"),
  parameters: z.record(z.any()),
});

type GeneratorFormValues = z.infer<typeof generatorFormSchema>;

export const ReportGenerator = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { toast } = useToast();
  
  // Fetch templates
  const templatesQuery = useQuery({
    queryKey: ['/api/report-templates'],
    queryFn: async () => {
      const response = await fetch('/api/report-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch report templates');
      }
      return response.json();
    }
  });
  
  // Form setup
  const form = useForm<GeneratorFormValues>({
    resolver: zodResolver(generatorFormSchema),
    defaultValues: {
      name: '',
      parameters: {},
    }
  });
  
  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (data: Partial<GeneratorFormValues>) => {
      setPreviewLoading(true);
      try {
        const response = await apiRequest('/api/report-preview', {
          method: 'POST',
          data,
        });
        setPreviewData(response);
        return response;
      } finally {
        setPreviewLoading(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Preview Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: GeneratorFormValues) => {
      const response = await apiRequest('/api/reports', {
        method: 'POST',
        data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "Report Queued",
        description: "Your report has been queued for generation.",
      });
      form.reset();
      setSelectedTemplate(null);
      setPreviewData(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    const id = parseInt(templateId, 10);
    const template = templatesQuery.data?.find((t: ReportTemplate) => t.id === id);
    
    if (template) {
      setSelectedTemplate(template);
      
      // Reset form with default values from template
      const defaultParams: Record<string, any> = {};
      
      Object.entries(template.requiredParameters).forEach(([key, param]) => {
        defaultParams[key] = param.defaultValue ?? getDefaultValueForType(param.type);
      });
      
      form.reset({
        templateId: id,
        name: `${template.name} - ${format(new Date(), 'yyyy-MM-dd')}`,
        parameters: defaultParams,
      });
      
      // Clear preview data when template changes
      setPreviewData(null);
    }
  };
  
  // Helper function to get default value based on parameter type
  const getDefaultValueForType = (type: string) => {
    switch (type) {
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'date':
        return new Date();
      case 'select':
        return '';
      default:
        return null;
    }
  };
  
  // Generate preview
  const handlePreview = () => {
    if (!form.formState.isValid) {
      form.trigger();
      return;
    }
    
    previewMutation.mutate(form.getValues());
  };
  
  // Handle form submission
  const onSubmit = (values: GeneratorFormValues) => {
    submitMutation.mutate(values);
  };
  
  // Render parameter fields based on template
  const renderParameterFields = () => {
    if (!selectedTemplate) return null;
    
    return Object.entries(selectedTemplate.requiredParameters).map(([key, param]) => {
      switch (param.type) {
        case 'string':
          return (
            <FormField
              key={key}
              control={form.control}
              name={`parameters.${key}`}
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>{param.label}</FormLabel>
                  <FormControl
</>
</>>
                    <Input {...field} />
                  </FormControl>
                  {param.description && (
                    <FormDescription>{param.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          );
          
        case 'number':
          return (
            <FormField
              key={key}
              control={form.control}
              name={`parameters.${key}`}
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>{param.label}</FormLabel>
                  <FormControl
</>
</>>
                    <Input 
                      {...field} 
                      type="number" 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  {param.description && (
                    <FormDescription>{param.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          );
          
        case 'boolean':
          return (
            <FormField
              key={key}
              control={form.control}
              name={`parameters.${key}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl><>

                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div
</>
className="space-y-1 leading-none">
                    <FormLabel>{param.label}</FormLabel>
                    {param.description && (
                      <FormDescription>{param.description}</FormDescription>
                    )}
                  </div>
                </FormItem>
              )}
            />
          );
          
        case 'date':
          return (
            <FormField
              key={key}
              control={form.control}
              name={`parameters.${key}`}
              render={({ field }) => (
                <FormItem className="flex flex-col"><>

                  <FormLabel>{param.label}</FormLabel>
                  <Popover
</>
</>>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {param.description && (
                    <FormDescription>{param.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          );
          
        case 'select':
          return (
            <FormField
              key={key}
              control={form.control}
              name={`parameters.${key}`}
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>{param.label}</FormLabel>
                  <Select
</>

                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {param.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {param.description && (
                    <FormDescription>{param.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          );
          
        default:
          return null;
      }
    });
  };
  
  // Render preview data
  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <p>Generating preview...</p>
        </div>
      );
    }
    
    if (!previewData) return null;
    
    return (
      <div className="mt-6 border rounded-md p-4"><>

        <h3 className="text-lg font-medium mb-2">Preview Results</h3>
        <div
</>
className="text-sm text-muted-foreground mb-4">
          This is a sample of the data that will be included in your full report.
        </div>
        
        {previewData.rows && previewData.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted border-b">
                  {Object.keys(previewData.rows[0]).map((column) => (
                    <th key={column} className="p-2 text-left text-xs font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.rows.slice(0, 5).map((row: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    {Object.values(row).map((value: any, valueIdx: number) => (
                      <td key={valueIdx} className="p-2 text-xs">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.rows.length > 5 && (
              <div className="text-xs text-center mt-2 text-muted-foreground">
                Showing 5 of {previewData.total || previewData.rows.length} results
              </div>
            )}
          </div>
        ) : (
          <Alert variant="warning" className="mt-2">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>No Preview Data</AlertTitle>
            <AlertDescription
</>
</>>
              No data was returned for the parameters you provided. The report may still generate 
              if you proceed, but you may want to adjust your parameters.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Report Generator
          <IllustratedTooltip
            illustration={illustrations.report.generator}
            title="Report Generator"
            content={
              <div><>

                <p className="mb-1">• Create custom reports from templates</p>
                <p
</>
className="mb-1">• Configure parameters for data selection</p><>

                <p className="mb-1">• Preview report data before generation</p>
                <p
</>
</>>• Queue reports for background processing</p>
              </div>
            }
            position="right"
          />
        </CardTitle>
        <CardDescription>
          Generate custom reports based on configurable templates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {templatesQuery.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <p>Loading templates...</p>
          </div>
        ) : templatesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Error</AlertTitle>
            <AlertDescription
</>
</>>
              Failed to load report templates. Please try again later.
            </AlertDescription>
          </Alert>
        ) : (
            <div className="mb-6"><>

              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Report Template
              </label>
              <Select
</>

                onValueChange={handleTemplateChange}
                value={selectedTemplate ? String(selectedTemplate.id) : undefined}
              >
                <SelectTrigger><>

                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent
</>
</>>
                  {templatesQuery.data?.map((template: ReportTemplate) => (
                    <SelectItem key={template.id} value={String(template.id)}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              )}
            </div>
            
            {selectedTemplate && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Report Name</FormLabel>
                        <FormControl
</>
</>><>

                          <Input 
                            {...field} 
                            placeholder="Enter a descriptive name for your report"
                          />
                        </FormControl>
                        <FormDescription
</>
</>>
                          This name will help you identify the report later
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Parameters</h3>
                    {renderParameterFields()}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreview}
                      disabled={previewLoading || !form.formState.isValid}
                    >
                      {previewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Preview
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitMutation.isPending || !form.formState.isValid}
                    >
                      {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate Report
                    </Button>
                  </div>
                  
                  {/* Success message for submission */}
                  {submitMutation.isSuccess && (
                    <Alert className="mt-4">
                      <CheckCircle2 className="h-4 w-4" /><>

                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription
</>
</>>
                        Your report has been queued for generation. You can view its status in the Reports Dashboard.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {renderPreview()}
                </form>
              </Form>
            )}
        )}
      </CardContent>
    </Card>
  );
};