
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DataImport {
  id: string;
  import_name: string;
  import_type: string;
  status: string;
  total_records: number;
  processed_records: number;
  success_records: number;
  error_records: number;
  file_path?: string;
  error_log: any[];
  metadata: any;
  started_at: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
}

export interface DataMappingConfig {
  id: string;
  config_name: string;
  source_type: string;
  target_table: string;
  field_mappings: any;
  validation_rules: any;
  transformation_rules: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDataImportRequest {
  import_name: string;
  import_type: string;
  status?: string;
  total_records?: number;
  processed_records?: number;
  success_records?: number;
  error_records?: number;
  file_path?: string;
  error_log?: any[];
  metadata?: any;
  created_by: string;
}

export interface CreateMappingConfigRequest {
  config_name: string;
  source_type: string;
  target_table: string;
  field_mappings: any;
  validation_rules?: any;
  transformation_rules?: any;
  is_active?: boolean;
}

export const useDataImports = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: imports, isLoading: importsLoading } = useQuery({
    queryKey: ['data-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DataImport[];
    }
  });

  const { data: mappingConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['data-mapping-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_mapping_configs')
        .select('*')
        .eq('is_active', true)
        .order('config_name');
      
      if (error) throw error;
      return data as DataMappingConfig[];
    }
  });

  const createImport = useMutation({
    mutationFn: async (importData: CreateDataImportRequest) => {
      const { data, error } = await supabase
        .from('data_imports')
        .insert(importData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-imports'] });
      toast({
        title: "Import Created",
        description: "Data import has been initiated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: `Failed to create import: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateImportStatus = useMutation({
    mutationFn: async ({ id, status, ...updateData }: { id: string; status: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('data_imports')
        .update({
          status,
          ...updateData,
          ...(status === 'completed' && { completed_at: new Date().toISOString() })
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-imports'] });
    }
  });

  const createMappingConfig = useMutation({
    mutationFn: async (configData: CreateMappingConfigRequest) => {
      const { data, error } = await supabase
        .from('data_mapping_configs')
        .insert(configData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-mapping-configs'] });
      toast({
        title: "Mapping Config Created",
        description: "Data mapping configuration saved successfully.",
      });
    }
  });

  return {
    imports,
    mappingConfigs,
    isLoading: importsLoading || configsLoading,
    createImport,
    updateImportStatus,
    createMappingConfig
  };
};

export const useImportErrors = (importId?: string) => {
  return useQuery({
    queryKey: ['import-errors', importId],
    queryFn: async () => {
      if (!importId) return [];
      
      const { data, error } = await supabase
        .from('import_errors')
        .select('*')
        .eq('import_id', importId)
        .order('row_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!importId
  });
};
