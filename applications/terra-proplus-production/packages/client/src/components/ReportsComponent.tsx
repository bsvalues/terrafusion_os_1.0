import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../lib/utils';

// Define interfaces for our data structures
type Report = {
  id: number;
  name: string;
  property: {
    address: string;
    type: string;
  };
  createdBy: string;
  date: string;
  status: 'Final' | 'Draft' | 'In Review' | 'Archived';
  type: string;
}

type ReportTemplate = {
  id: number;
  name: string;
  description: string;
  isSelected: boolean;
}

type ReportOption = {
  id: string;
  name: string;
  description?: string;
  type: 'select' | 'toggle';
  options?: string[];
  value: string | boolean;
}

const ReportsComponent = () => {
  // State for reports list
  const [reports, setReports] = useState<Report[]>([
    {
      id: 1,
      name: '123 Main Street Appraisal',
      property: {
        address: '123 Main Street, Austin, TX 78701',
        type: 'Residential Form 1004'
      },
      createdBy: 'John Doe',
      date: '2025-05-18',
      status: 'Final',
      type: 'Form 1004'
    },
    {
      id: 2,
      name: '456 Oak Avenue Appraisal',
      property: {
        address: '456 Oak Avenue, Austin, TX 78704',
        type: 'Condo Form 1073'
      },
      createdBy: 'Jane Smith',
      date: '2025-05-15',
      status: 'In Review',
      type: 'Form 1073'
    },
    {
      id: 3,
      name: '789 Elm Drive Appraisal',
      property: {
        address: '789 Elm Drive, Austin, TX 78745',
        type: 'Residential Form 1004'
      },
      createdBy: 'Robert Johnson',
      date: '2025-05-10',
      status: 'Draft',
      type: 'Form 1004'
    },
    {
      id: 4,
      name: '101 Pine Road Appraisal',
      property: {
        address: '101 Pine Road, Austin, TX 78735',
        type: 'Income Form 1025'
      },
      createdBy: 'Emily Wilson',
      date: '2025-05-05',
      status: 'Final',
      type: 'Form 1025'
    },
    {
      id: 5,
      name: '555 Maple Street Appraisal',
      property: {
        address: '555 Maple Street, Austin, TX 78702',
        type: 'Narrative Report'
      },
      createdBy: 'John Doe',
      date: '2025-05-01',
      status: 'Archived',
      type: 'Narrative'
    }
  ]);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // State for templates
  const [templates, setTemplates] = useState<ReportTemplate[]>([
    { id: 1, name: 'Uniform Residential (1004)', description: 'Standard FNMA form', isSelected: true },
    { id: 2, name: 'Individual Condo (1073)', description: 'Condominium form', isSelected: false },
    { id: 3, name: 'Small Income (1025)', description: 'For 2-4 unit properties', isSelected: false },
    { id: 4, name: 'Narrative Report', description: 'Customizable format', isSelected: false },
    { id: 5, name: 'Desktop Appraisal', description: 'Form 1004 Desktop', isSelected: false },
    { id: 6, name: 'FHA Report', description: 'For FHA loans', isSelected: false }
  ]);
  
  // State for report generation options
  const [reportOptions, setReportOptions] = useState<ReportOption[]>([
    {
      id: 'sections',
      name: 'Include Sections',
      type: 'select',
      options: ['All Sections', 'Core Sections Only', 'Custom Selection'],
      value: 'All Sections'
    },
    {
      id: 'comparables',
      name: 'Comparable Properties',
      type: 'select',
      options: ['Selected (3)', 'All (6)', 'Custom Range'],
      value: 'Selected (3)'
    },
    {
      id: 'marketAnalysis',
      name: 'Add Market Analysis',
      type: 'select',
      options: ['Full Analysis', 'Summary Only', 'None'],
      value: 'Full Analysis'
    },
    {
      id: 'includePhotos',
      name: 'Include Property Photos',
      type: 'toggle',
      value: true
    },
    {
      id: 'includeMap',
      name: 'Include Map',
      type: 'toggle',
      value: true
    },
    {
      id: 'digitalSignature',
      name: 'Add Digital Signature',
      type: 'toggle',
      value: true
    }
  ]);
  
  // Handler for selecting a template
  const handleTemplateSelect = (id: number) => {
    setTemplates(templates.map(template => ({
      ...template,
      isSelected: template.id === id
    })));
  };
  
  // Handler for changing report options
  const handleOptionChange = (id: string, value: string | boolean) => {
    setReportOptions(reportOptions.map(option => 
      option.id === id ? { ...option, value } : option
    ));
  };
  
  // Filtered reports based on search and filters
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.property.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = reportTypeFilter === 'all' || report.type === reportTypeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // Function to determine status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Final':
        return 'bg-green-100 text-green-800';
      case 'Draft':
        return 'bg-blue-100 text-blue-800';
      case 'In Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handler for generating a new report
  const handleGenerateReport = () => {
    alert('Report generation initiated. The report will be available shortly.');
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div><>

            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              Reports
            </h1>
            <p
</> className="text-gray-600">Generate and manage appraisal reports</p>
          </div>
          
          <button 
            onClick={() => {}} 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
            </svg>
            Generate New Report
          </button>
        </div>
        
        {/* Recent Reports Card */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium flex items-center">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-2 text-sm font-semibold">
                R
              </span>
              Recent Reports
            </h2>
          </div>
          
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div><>

                <input
                  type="text"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
</>
                className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={reportTypeFilter}
                onChange={(e) => setReportTypeFilter(e.target.value)}
              ><>

                <option value="all">All Report Types</option>
                <option
</> value="Form 1004">Form 1004</option><>

                <option value="Form 1073">Form 1073</option>
                <option
</> value="Form 1025">Form 1025</option>
                <option value="Narrative">Narrative</option>
              </select>
              
              <select
                className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              ><>

                <option value="all">All Statuses</option>
                <option
</> value="Final">Final</option><>

                <option value="Draft">Draft</option>
                <option
</> value="In Review">In Review</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr><>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th><>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th><>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th
</> scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4"><>

                          <div className="text-sm font-medium text-gray-900">
                            {report.name}
                          </div>
                          <div
</> className="text-sm text-gray-500">
                            {report.property.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.createdBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(report.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </td><>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.type}
                    </td>
                    <td
</> className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          View
                        </button>
                        <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredReports.length === 0 && (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><>

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3
</> className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No reports match your current search criteria.
              </p>
            </div>
          )}
          
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredReports.length}</span> of <span className="font-medium">{reports.length}</span> reports
            </p>
            <div className="flex-1 flex justify-end">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"><>

                  <span className="sr-only">Previous</span>
                  <svg
</> className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button><>

                <button className="relative inline-flex items-center px-4 py-2 border border-blue-500 bg-blue-50 text-sm font-medium text-blue-600">
                  1
                </button>
                <button
</> className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  2
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"><>

                  <span className="sr-only">Next</span>
                  <svg
</> className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
        
        {/* Report Templates & Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Templates Section */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium flex items-center">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-2 text-sm font-semibold">
                  T
                </span>
                Report Templates
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                      template.isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-300' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="h-20 bg-gray-50 relative">
                      <div className="absolute inset-0 flex flex-col p-2"><>

                        <div className="h-2 w-3/4 bg-gray-200 rounded mb-1"></div>
                        <div
</> className="h-2 w-5/6 bg-gray-200 rounded mb-1"></div><>

                        <div className="h-2 w-2/3 bg-gray-200 rounded mb-1"></div>
                        <div
</> className="h-2 w-4/5 bg-gray-200 rounded mb-1"></div>
                        <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                      </div>
                      {template.isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200"><>

                      <h3 className="text-sm font-medium truncate">{template.name}</h3>
                      <p
</> className="text-xs text-gray-500 mt-1">{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Report Generation Settings */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium flex items-center">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mr-2 text-sm font-semibold">
                  S
                </span>
                Report Generation Settings
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {reportOptions.map(option => (
                  <div key={option.id} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">{option.name}</h3>
                    
                    {option.type === 'select' && (
                      <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={option.value as string}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                      >
                        {option.options?.map((opt /* , index */) => (
                          <option key={index} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    
                    {option.type === 'toggle' && (
                      <div className="flex items-center">
                        <button
                          type="button"
                          className={`${
                            option.value ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                          onClick={() => handleOptionChange(option.id, !option.value)}
                        >
                          <span
                            className={`${
                              option.value ? 'translate-x-5' : 'translate-x-0'
                            } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          >
                            <span
                              className={`${
                                option.value ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'
                              } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                              aria-hidden="true"
                            >
                              <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                                <path
                                  d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <span
                              className={`${
                                option.value ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'
                              } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                              aria-hidden="true"
                            >
                              <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 12 12">
                                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                              </svg>
                            </span>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Report Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200"><>

                  <h3 className="text-sm font-medium text-gray-700">Report Preview</h3>
                  <div
</> className="flex space-x-1">
                    <button className="p-1 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                    <button className="p-1 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <button className="p-1 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-4 max-h-80 overflow-y-auto">
                  <div className="mb-6"><>

                    <h3 className="text-base font-semibold mb-2 pb-2 border-b border-gray-200">
                      Uniform Residential Appraisal Report
                    </h3>
                    
                    <div
</> className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      <div><>

                        <p className="text-xs text-gray-500">File No.</p>
                        <p
</> className="text-sm font-medium">A-2025-042</p>
                      </div>
                      <div><>

                        <p className="text-xs text-gray-500">Property Address</p>
                        <p
</> className="text-sm font-medium">123 Main Street</p>
                      </div>
                      <div><>

                        <p className="text-xs text-gray-500">City</p>
                        <p
</> className="text-sm font-medium">Austin</p>
                      </div>
                      <div><>

                        <p className="text-xs text-gray-500">State</p>
                        <p
</> className="text-sm font-medium">TX</p>
                      </div>
                      <div><>

                        <p className="text-xs text-gray-500">Zip Code</p>
                        <p
</> className="text-sm font-medium">78701</p>
                      </div>
                      <div><>

                        <p className="text-xs text-gray-500">County</p>
                        <p
</> className="text-sm font-medium">Travis</p>
                      </div>
                    </div>
                    
                    <div className="text-sm mb-4"><>

                      <p className="text-xs text-gray-500">Legal Description</p>
                      <p
</> className="text-sm">Lot 12, Block B, Austin Heights Addition</p>
                    </div>
                  </div>
                  
                  <div className="mb-6"><>

                    <h3 className="text-base font-semibold mb-2 pb-2 border-b border-gray-200">
                      Subject Property Information
                    </h3>
                    
                    <div
</> className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      <div><>

                        <p className="text-xs text-gray-500">Property Type</p>
                        <p
</> className="text-sm font-medium">Single Family</p>
                      </div>
                      <div><>

                        <p className="text-xs text-gray-500">Year Built</p>
                        <p
</> className="text-sm font-medium">2005</p>
                      </div>
                      <div><>

                        <p className="text-xs text-gray-500">Square Feet</p>
                        <p
</> className="text-sm font-medium">2,450</p>
                      </div>
                      <div><>

                        <p className="text-xs text-gray-500">Bedrooms</p>
                        <p
</> className="text-sm font-medium">3</p>
                      </div>
                      <div><>

                        <p className="text-xs text-gray-500">Bathrooms</p>
                        <p
</> className="text-sm font-medium">2.5</p>
                      </div>
                      <div><>

                        <p className="text-xs text-gray-500">Lot Size</p>
                        <p
</> className="text-sm font-medium">8,500 sq.ft.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleGenerateReport}
                className="w-full mt-6 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsComponent;