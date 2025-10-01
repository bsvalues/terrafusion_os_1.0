import { useState, useEffect, useCallback } from 'react';
import {
  ReportConfiguration,
  DataSource,
  ReportTemplate,
  ReportData,
  OutputFormat,
  UseReportBuilderReturn,
} from '../types/ReportTypes';
import { reportBuilderService } from '../services/ReportBuilderService';

export const useReportBuilder = (jurisdiction: string): UseReportBuilderReturn => {
  const [report, setReport] = useState<ReportConfiguration>({
    name: 'New Report',
    description: '',
    category: 'revenue',
    accessLevel: 'internal',
    jurisdiction,
    elements: [],
    isTemplate: false,
    createdBy: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    version: 1,
  });

  const [availableDataSources, setAvailableDataSources] = useState<DataSource[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [dataSources, metrics, templates] = await Promise.all([
          reportBuilderService.getDataSources(jurisdiction),
          reportBuilderService.getAvailableMetrics(jurisdiction),
          reportBuilderService.getReportTemplates(),
        ]);

        setAvailableDataSources(dataSources);
        setAvailableMetrics(metrics);
        setAvailableTemplates(templates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load initial data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [jurisdiction]);

  const saveReport = useCallback(async (reportToSave: ReportConfiguration) => {
    try {
      setIsLoading(true);
      setError(null);

      const savedReport = await reportBuilderService.saveReport(reportToSave);
      setReport(savedReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleReport = useCallback(async (reportToSchedule: ReportConfiguration) => {
    try {
      setIsLoading(true);
      setError(null);

      await reportBuilderService.scheduleReport(reportToSchedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule report');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const previewReport = useCallback(
    async (reportToPreview: ReportConfiguration): Promise<ReportData> => {
      try {
        setIsLoading(true);
        setError(null);

        return await reportBuilderService.previewReport(reportToPreview);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to preview report');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const exportReport = useCallback(
    async (reportId: string, format: OutputFormat): Promise<string> => {
      try {
        setIsLoading(true);
        setError(null);

        return await reportBuilderService.exportReport(reportId, format);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to export report');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const duplicateReport = useCallback(async (reportId: string): Promise<ReportConfiguration> => {
    try {
      setIsLoading(true);
      setError(null);

      return await reportBuilderService.duplicateReport(reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate report');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await reportBuilderService.deleteReport(reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    report,
    setReport,
    availableDataSources,
    availableMetrics,
    availableTemplates,
    isLoading,
    error,
    saveReport,
    scheduleReport,
    previewReport,
    exportReport,
    duplicateReport,
    deleteReport,
  };
};
