import React, { useState, useEffect } from 'react';
import { Database, Play, Download, Table, Search, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import DatabaseService, { DatabaseInfo, QueryResult } from '../services/DatabaseService';

export const DatabaseExplorer: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [query, setQuery] = useState<string>('SELECT * FROM parcels LIMIT 10');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);

  // Load databases on mount
  useEffect(() => {
    loadDatabases();
  }, []);

  // Load tables when database changes
  useEffect(() => {
    if (selectedDatabase) {
      loadTables();
    }
  }, [selectedDatabase]);

  const loadDatabases = async () => {
    const dbs = await DatabaseService.getDatabases();
    setDatabases(dbs);
    if (dbs.length > 0 && !selectedDatabase) {
      setSelectedDatabase(dbs[0].Name);
    }
  };

  const loadTables = async () => {
    if (!selectedDatabase) return;
    const result = await DatabaseService.listTables(selectedDatabase);
    if (result.Success) {
      const tableNames = result.Rows.map(row => row.name as string);
      setTables(tableNames);
    }
  };

  const executeQuery = async () => {
    if (!selectedDatabase || !query.trim()) return;

    setLoading(true);
    try {
      const result = await DatabaseService.executeQuery({
        DatabaseName: selectedDatabase,
        Query: query,
        MaxRows: 1000
      });
      setResults(result);
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = (tableName: string) => {
    setQuery(`SELECT * FROM ${tableName} LIMIT 100`);
  };

  const exportToCSV = () => {
    if (!results || results.Rows.length === 0) return;

    const headers = Object.keys(results.Rows[0]);
    const csvContent = [
      headers.join(','),
      ...results.Rows.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDatabase}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Database Explorer</h2>
          <span className="text-sm text-gray-400">
            {databases.length} databases | {results?.RowCount || 0} rows
          </span>
        </div>
        <button
          onClick={loadDatabases}
          className="p-2 hover:bg-gray-700 rounded"
          title="Refresh databases"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Database Selector */}
          <div className="p-3 border-b border-gray-700">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Database
            </label>
            <select
              value={selectedDatabase}
              onChange={(e) => setSelectedDatabase(e.target.value)}
              className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm"
            >
              {databases.map((db) => (
                <option key={db.Name} value={db.Name}>
                  {db.Name} ({db.SizeMB}MB)
                </option>
              ))}
            </select>
          </div>

          {/* Tables List */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
              <Table className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-400">
                TABLES ({tables.length})
              </span>
            </div>
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => loadTableData(table)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-gray-700 rounded mb-1 text-gray-300 hover:text-white transition-colors"
              >
                {table}
              </button>
            ))}
            {tables.length === 0 && (
              <div className="text-xs text-gray-500 px-2">
                No tables found
              </div>
            )}
          </div>

          {/* Quick Queries */}
          <div className="p-3 border-t border-gray-700">
            <div className="text-xs font-medium text-gray-400 mb-2">QUICK QUERIES</div>
            <button
              onClick={() => setQuery('SELECT * FROM parcels LIMIT 100')}
              className="w-full text-left px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded mb-1"
            >
              All Parcels (100)
            </button>
            <button
              onClick={() => setQuery('SELECT COUNT(*) as total FROM parcels')}
              className="w-full text-left px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded mb-1"
            >
              Count Parcels
            </button>
            <button
              onClick={() => setQuery('SELECT * FROM parcels WHERE AssessedValue > 300000 LIMIT 50')}
              className="w-full text-left px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              High Value Properties
            </button>
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col">
          {/* Query Editor */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-gray-400" />
              <label className="text-sm font-medium">SQL Query</label>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded font-mono text-sm resize-none"
              rows={3}
              placeholder="Enter SQL query..."
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={executeQuery}
                disabled={loading || !selectedDatabase}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                {loading ? 'Executing...' : 'Execute Query'}
              </button>
              {results && results.Success && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {/* Results Display */}
          <div className="flex-1 overflow-hidden flex flex-col p-4">
            {results && (
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {results.Success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm">
                    {results.Success
                      ? `${results.RowCount} rows returned in ${results.ExecutionTimeMs}ms`
                      : `Error: ${results.Error}`}
                  </span>
                </div>
                {results.Message && (
                  <span className="text-xs text-yellow-400">{results.Message}</span>
                )}
              </div>
            )}

            {results && results.Success && results.Rows.length > 0 && (
              <div className="flex-1 overflow-auto bg-gray-800 rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700 sticky top-0">
                    <tr>
                      {Object.keys(results.Rows[0]).map((header) => (
                        <th
                          key={header}
                          className="px-4 py-2 text-left font-medium text-gray-300 border-b border-gray-600"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.Rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-700 hover:bg-gray-750"
                      >
                        {Object.values(row).map((value, cellIdx) => (
                          <td key={cellIdx} className="px-4 py-2 text-gray-300">
                            {value === null ? (
                              <span className="text-gray-500 italic">NULL</span>
                            ) : (
                              String(value)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {results && !results.Success && (
              <div className="p-4 bg-red-900/20 border border-red-700 rounded">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Query Failed</span>
                </div>
                <pre className="mt-2 text-sm text-red-300">{results.Error}</pre>
              </div>
            )}

            {!results && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Execute a query to see results</p>
                  <p className="text-sm mt-1">Select a table or write your own SQL</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseExplorer;
