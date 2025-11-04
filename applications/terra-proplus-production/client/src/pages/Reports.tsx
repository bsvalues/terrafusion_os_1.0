import { useState } from 'react';
import { FileText, Download, Filter, Calendar, Search  } from '@mui/icons-material';

const Reports = () => {
  const [selectedReportType, setSelectedReportType] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Sample report data
  const reports = [
    {
      id: 1,
      title: 'Single Family Home Appraisal',
      property: '123 Main St, Austin, TX',
      type: 'Residential',
      date: '2025-05-10',
      appraiser: 'Michael Rodriguez',
      status: 'Completed'
    },
    {
      id: 2,
      title: 'Commercial Property Valuation',
      property: '456 Business Ave, Dallas, TX',
      type: 'Commercial',
      date: '2025-05-05',
      appraiser: 'Sarah Johnson',
      status: 'Completed'
    },
    {
      id: 3,
      title: 'Multi-Family Rental Assessment',
      property: '789 Pine Blvd, Houston, TX',
      type: 'Multi-Family',
      date: '2025-05-15',
      appraiser: 'Michael Rodriguez',
      status: 'In Progress'
    },
    {
      id: 4,
      title: 'Land Valuation Report',
      property: '234 Rural Road, San Antonio, TX',
      type: 'Land',
      date: '2025-04-28',
      appraiser: 'David Thompson',
      status: 'Completed'
    },
    {
      id: 5,
      title: 'Condominium Market Analysis',
      property: '567 Tower Dr, Austin, TX',
      type: 'Residential',
      date: '2025-04-22',
      appraiser: 'Sarah Johnson',
      status: 'Completed'
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedReportType(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter reports based on selected criteria
  const filteredReports = reports.filter(report => {
    // Filter by report type
    if (selectedReportType !== 'all' && report.type !== selectedReportType) {
      return false;
    }
    
    // Filter by date range
    if (dateRange.from && new Date(report.date) < new Date(dateRange.from)) {
      return false;
    }
    
    if (dateRange.to && new Date(report.date) > new Date(dateRange.to)) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !report.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !report.property.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><>

              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
</>
                id="reportType"
                className="block w-full rounded-md border-gray-300"
                value={selectedReportType}
                onChange={handleReportTypeChange}
              ><>

                <option value="all">All Types</option>
                <option
</> value="Residential">Residential</option><>

                <option value="Commercial">Commercial</option>
                <option
</> value="Multi-Family">Multi-Family</option>
                <option value="Land">Land</option>
              </select>
            </div>
            
            <div><>

              <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
</>
                type="date"
                id="fromDate"
                name="from"
                className="block w-full rounded-md border-gray-300"
                value={dateRange.from}
                onChange={handleDateChange}
              />
            </div>
            
            <div><>

              <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
</>
                type="date"
                id="toDate"
                name="to"
                className="block w-full rounded-md border-gray-300"
                value={dateRange.to}
                onChange={handleDateChange}
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><>

                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
</>
                type="search"
                placeholder="Search reports by title, property..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Search
            </button>
          </div>
        </form>
      </div>
      
      {/* Reports Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left"><>

                <th className="px-6 py-3">Report</th>
                <th
</> className="px-6 py-3">Property</th><>

                <th className="px-6 py-3">Date</th>
                <th
</> className="px-6 py-3">Appraiser</th><>

                <th className="px-6 py-3">Status</th>
                <th
</> className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-2" />
                        <div><>

                          <p className="font-medium text-primary-600">{report.title}</p>
                          <p
</> className="text-xs text-gray-500">{report.type}</p>
                        </div>
                      </div>
                    </td><>

                    <td className="px-6 py-4">{report.property}</td>
                    <td
</> className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                        <span>{new Date(report.date).toLocaleDateString()}</span>
                      </div>
                    </td><>

                    <td className="px-6 py-4">{report.appraiser}</td>
                    <td
</> className="px-6 py-4">
                      <span className={`status-badge ${
                        report.status === 'Completed' 
                          ? 'status-badge-success' 
                          : 'status-badge-in-progress'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                        aria-label="Download report"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No reports match the selected criteria. Try adjusting your filters or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;