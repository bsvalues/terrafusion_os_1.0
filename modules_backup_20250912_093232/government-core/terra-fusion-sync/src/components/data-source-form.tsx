import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {insertDataSourceSchema,
  type InsertDataSource,
  sqlConfigSchema,
  apiConfigSchema,
  cloudStorageConfigSchema,} from '@shared/schema';
import {Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {apiRequest} from '@/lib/queryClient';
import {Switch} from '@/components/ui/switch';
import {useState} from 'react';
import {Dataset as Database,
  Public as Globe,
  Storage as HardDrive,
  Lock,
  Computer as Server,
  Person as User,} from '@mui/icons-material';

import * as z from 'zod';

type SourceType = 'database' | 'api' | 'file' | 'cloud';

const sourceTypes = [
  {value: 'database' as const,
    label: 'SQL Database',
    icon: Database,
    description: 'Connect to SQL databases like PostgreSQL, MySQL, etc.',},
  {value: 'api' as const,
    label: 'REST API',
    icon: Globe,
    description: 'Connect to REST APIs with custom authentication',},
  {value: 'cloud' as const,
    label: 'Cloud Storage',
    icon: HardDrive,
    description: 'Connect to S3, Google Cloud Storage, or Azure Blob',},
];

const sqlDialects = [
  {value: 'sqlserver', label: 'SQL Server', icon: Database},
  {value: 'postgres', label: 'PostgreSQL', icon: Database},
  {value: 'mysql', label: 'MySQL', icon: Database},
];

const dataSourceSchema = insertDataSourceSchema.extend({name: z.string().min(1, 'Source name is required'),
  config: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('sql'),
      config: sqlConfigSchema
        .extend({
          dialect: z.enum(['sqlserver', 'postgres', 'mysql']),
          host: z.string().min(1, 'Server name/IP is required'),
          port: z
            .number()
            .min(1, 'Port must be between 1 and 65535')
            .max(65535, 'Port must be between 1 and 65535'),
          database: z.string().min(1, 'Database name is required'),
          username: z.string().optional(),
          password: z.string().optional(),
          encrypt: z.boolean(),
          trustedConnection: z.boolean(),
          instanceName: z.string().optional(),})
        .superRefine((data, ctx) => {if (!data.trustedConnection && (!data.username || !data.password)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Username and password are required when not using Windows Authentication',
              path: ['username'],});
          }
        }),
    }),
    z.object({type: z.literal('api'),
      config: apiConfigSchema,}),
    z.object({type: z.literal('cloud_storage'),
      config: cloudStorageConfigSchema,}),
  ]),
});

export function DataSourceForm() {const { toast} = useToast();
  const queryClient = useQueryClient();
  const [sourceType, setSourceType] = useState<SourceType>('database');

  const defaultSqlConfig = {dialect: 'sqlserver' as const,
    host: '',
    port: 1433,
    database: '',
    username: '',
    password: '',
    encrypt: true,
    trustedConnection: false,
    instanceName: '',};

  const defaultApiConfig = {
    baseUrl: '',
    authType: 'none' as const,
    headers: {},
  };

  const defaultCloudStorageConfig = {
    provider: 's3' as const,
    bucket: '',
    credentials: {},
    prefix: '',
    region: '',
  };

  const getDefaultConfig = (type: SourceType) =>{switch (type) {
      case 'database':
        return { type: 'sql' as const, config: defaultSqlConfig};
      case 'api':
        return {type: 'api' as const, config: defaultApiConfig};
      case 'cloud':
        return {type: 'cloud_storage' as const, config: defaultCloudStorageConfig};
    }
  };

  const form = useForm({resolver: zodResolver(dataSourceSchema) as any,
    defaultValues: {
      name: '',
      type: 'database',
      config: getDefaultConfig('database'),},
  });

  const createMutation = useMutation({mutationFn: async (values: InsertDataSource) => {
      const res = await apiRequest('POST', '/api/data-sources', values);
      if (!res.ok) {
        throw new Error('Failed to create data source');}
      return res.json();
    },
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['/api/data-sources']});
      toast({title: 'Data source created',
        description: 'Your data source has been created successfully',});
      form.reset(form.getValues());
    },
    onError: (error: Error) => {toast({
        title: 'Error creating data source',
        description: error.message,});
    },
  });

  const onSubmit = (values: InsertDataSource) => {createMutation.mutate(values);};

  const renderConfigFields = () => {
    switch (sourceType) {
      case 'database':
        return (<><FormField
              control={form.control}
              name="config.config.dialect"
              render={({ field}) => (<FormItem className="tf-government-badge"><FormLabel className="tf-transcendence-glow">Database Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger data-testid="dialect-select" className="tf-clarity-gradient"><SelectValue placeholder="Select database type" /></SelectTrigger></FormControl><SelectContent>{sqlDialects.map(dialect => (<SelectItem
                          key={dialect.value}
                          value={dialect.value}
                          data-testid={`dialect-option-${dialect.value}`}
                        ><div className="flex items-center gap-2"><dialect.icon className="w-4 h-4" /><span>{dialect.label}</span></div></SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )}
            /><FormField
              control={form.control}
              name="config.config.host"
              render={({ field}) => (<FormItem className="tf-government-badge"><FormLabel className="tf-transcendence-glow">Server Name/IP</FormLabel><FormControl><div className="flex items-center space-x-2"><Server className="w-4 h-4 text-muted-foreground" /><Input
                        placeholder="localhost or server name"
                        {...field}
                        data-testid="host-input"
                        className="tf-clarity-gradient" /></div></FormControl><FormDescription className="tf-government-badge">For SQL Server, you can use server name or IP address</FormDescription><FormMessage /></FormItem>
              )}
            /><FormField
              control={form.control}
              name="config.config.port"
              render={({ field}) => (<FormItem className="tf-government-badge"><FormLabel className="tf-transcendence-glow">Port</FormLabel><FormControl><Input
                      type="number"
                      placeholder="1433"
                      {...field}
                      value={field.value?.toString() || ''}
                      onChange={e =>
                        field.onChange(e.target.value ? parseInt(e.target.value, 10) : '')}
                      data-testid="port-input"
                      className="tf-clarity-gradient"
                    /></FormControl><FormMessage /></FormItem>
              )}
            /><FormField
              control={form.control}
              name="config.config.database"
              render={({ field}) => (<FormItem className="tf-government-badge"><FormLabel className="tf-transcendence-glow">Database Name</FormLabel><FormControl><div className="flex items-center space-x-2"><Database className="w-4 h-4 text-muted-foreground" /><Input
                        placeholder="master"
                        {...field}
                        data-testid="database-input"
                        className="tf-clarity-gradient" /></div></FormControl><FormMessage /></FormItem>
              )}
            /><FormField
              control={form.control}
              name="config.config.trustedConnection"
              render={({ field}) => (<FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4 tf-government-badge"><div className="space-y-0.5"><FormLabel className="tf-transcendence-glow">Windows Authentication</FormLabel><FormDescription className="tf-clarity-gradient">Use Windows integrated security</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}
            />
            {!form.watch('config.config.trustedConnection') && (<><FormField
                  control={form.control}
                  name="config.config.username"
                  render={({ field}) => (<FormItem className="tf-government-badge"><FormLabel className="tf-transcendence-glow">Username</FormLabel><FormControl><div className="flex items-center space-x-2"><User className="w-4 h-4 text-muted-foreground" /><Input
                            placeholder="sa"
                            {...field}
                            data-testid="username-input"
                            className="tf-clarity-gradient" /></div></FormControl><FormMessage /></FormItem>
                  )}
                /><FormField
                  control={form.control}
                  name="config.config.password"
                  render={({ field}) => (<FormItem className="tf-government-badge"><FormLabel className="tf-transcendence-glow">Password</FormLabel><FormControl><div className="flex items-center space-x-2"><Lock className="w-4 h-4 text-muted-foreground" /><Input
                            type="password"
                            {...field}
                            data-testid="password-input"
                            className="tf-clarity-gradient" /></div></FormControl><FormMessage /></FormItem>
                  )}
                /></>)}<FormField
              control={form.control}
              name="config.config.encrypt"
              render={({ field}) => (<FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4 tf-government-badge"><div className="space-y-0.5"><FormLabel className="tf-transcendence-glow">Encrypt Connection</FormLabel><FormDescription className="tf-clarity-gradient">Use encryption for data sent between client and server</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )}
            /></>);
      default:
        return null;
    }
  };

  return (<Form {...form}><form
        onSubmit={form.handleSubmit(onSubmit as any)}
        className="space-y-6"
        data-testid="data-source-form"
      ><FormField
          control={form.control}
          name="name"
          render={({ field}) => (<FormItem className="tf-government-badge"><FormLabel className="tf-transcendence-glow">Name</FormLabel><FormControl><Input
                  placeholder="My Data Source"
                  {...field}
                  data-testid="name-input"
                  className="tf-clarity-gradient" /></FormControl><FormMessage data-testid="name-validation-error" /></FormItem>
          )}
        /><FormField
          control={form.control}
          name="type"
          render={({ field}) => (<FormItem className="tf-government-badge"><FormLabel className="tf-transcendence-glow">Type</FormLabel><Select
                onValueChange={(value: SourceType) => {
                  field.onChange(value);
                  setSourceType(value);
                  const newConfig = getDefaultConfig(value);
                  form.reset({
                    ...form.getValues(),
                    type: value,
                    config: newConfig,});
                }}
                defaultValue={field.value}
              ><FormControl><SelectTrigger data-testid="type-select" className="tf-clarity-gradient"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{sourceTypes.map(type => (<SelectItem
                      key={type.value}
                      value={type.value}
                      data-testid={`type-option-${type.value}`}
                    ><div className="flex items-center gap-2"><type.icon className="w-4 h-4" /><div><div>{type.label}</div><p className="text-xs text-muted-foreground">{type.description}</p></div></div></SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
          )}
        /><div className="space-y-4">{renderConfigFields()}</div><Button
          type="submit"
          disabled={createMutation.isPending}
          data-testid="submit-button"
          className="tf-transcendence-glow"
        >{createMutation.isPending ? 'Creating...' : 'Create Data Source'}</Button></form></Form>
  );
}
