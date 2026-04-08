import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  FileUp, 
  Database, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { PacsModule } from '@/lib/types';
import { usePacsModules } from '@/hooks/use-pacs-modules';

// Mock interface for import status (will be replaced with real API)
interface ImportStatus {
  id: string;
  moduleName: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  recordsCount: number;
  startTime: string;
  endTime?: string;
  errorMessage?: string;
}

const Imports = () => {
  const { modules, isLoading: modulesLoading, initializePacsModules } = usePacsModules();
  const [selectedTab, setSelectedTab] = useState<'modules' | 'history'>('modules');
  
  // This would be a real API call in production
  const { data: importHistory = [], isLoading: historyLoading } = useQuery<ImportStatus[]>({
    queryKey: ['/api/imports/history'],
    // Disable this query as it's not implemented in the backend yet
    enabled: false,
  });
  
  // Sample import history for UI demonstration
  const sampleImportHistory: ImportStatus[] = [
    {
      id: '1',
      moduleName: 'Land',
      status: 'completed',
      recordsCount: 156,
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() - 3540000).toISOString(),
    },
    {
      id: '2',
      moduleName: 'Improvements',
      status: 'completed',
      recordsCount: 89,
      startTime: new Date(Date.now() - 7200000).toISOString(),
      endTime: new Date(Date.now() - 7140000).toISOString(),
    },
    {
      id: '3',
      moduleName: 'Fields',
      status: 'processing',
      recordsCount: 42,
      startTime: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: '4',
      moduleName: 'Imports',
      status: 'failed',
      recordsCount: 0,
      startTime: new Date(Date.now() - 10800000).toISOString(),
      endTime: new Date(Date.now() - 10780000).toISOString(),
      errorMessage: 'Invalid file format'
    }
  ];
  
  // For now, use sample data since the backend API isn't fully implemented
  const history = importHistory.length > 0 ? importHistory : sampleImportHistory;
  
  // Header actions
  const headerActions = (
    <Button className="inline-flex items-center">
      <Upload className="h-5 w-5 mr-2" />
      Start New Import
    </Button>
  );
  
  // Status icon for import history
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <>
      <PageHeader 
        title="Data Imports" 
        subtitle="Data Management"
        actions={headerActions}
      />
      
      <div className="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8 py-6">
        {/* Tab navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setSelectedTab('modules')}
              className={`${
                selectedTab === 'modules'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              PACS Modules
            </button>
            <button
              onClick={() => setSelectedTab('history')}
              className={`${
                selectedTab === 'history'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Import History
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        {selectedTab === 'modules' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Available PACS Modules</CardTitle>
            </CardHeader>
            <CardContent>
              {modulesLoading ? (
                <div className="text-center py-4">Loading modules...</div>
              ) : modules.length === 0 ? (
                <div className="text-center py-10">
                  <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No PACS modules have been initialized yet</p>
                  <Button onClick={() => initializePacsModules()}>
                    Initialize PACS Modules
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Module Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Source</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Integration Status</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {modules.map(module => (
                        <tr key={module.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                            {module.moduleName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {module.source}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              module.integration === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : module.integration === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {module.integration.charAt(0).toUpperCase() + module.integration.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {module.description || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <Button variant="outline" size="sm" className="mr-2">
                              <FileUp className="h-4 w-4 mr-2" />
                              Import
                            </Button>
                            <Button variant="ghost" size="sm">Configure</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Import History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-4">Loading import history...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No import history available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Module</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Records</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Time</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">End Time</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {history.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                            {item.moduleName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              {getStatusIcon(item.status)}
                              <span className="ml-2 capitalize">
                                {item.status}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {item.recordsCount}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(item.startTime).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {item.endTime ? new Date(item.endTime).toLocaleString() : '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={item.status === 'processing'}
                            >
                              {item.status === 'failed' ? 'Retry' : 'View Details'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default Imports;
