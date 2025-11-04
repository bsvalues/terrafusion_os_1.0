import { useState, useRef } from "react";

export default function SimpleLegacyImporter() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamData, setStreamData] = useState<any[]>([]);
  const [status, setStatus] = useState("Ready to import");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const startDemoStream = () => {
    setIsStreaming(true);
    setStreamData([]);
    setStatus("Starting import...");

    const mockData = [
      {
        address: "123 Elm Street, Seattle, WA",
        sale_price_usd: 425000,
        gla_sqft: 2125,
        sale_date: "2023-05-15",
        source_table: "sqlite_demo",
      },
      {
        address: "456 Oak Avenue, Portland, OR",
        sale_price_usd: 385000,
        gla_sqft: 1950,
        sale_date: "2023-06-22",
        source_table: "sqlite_demo",
      },
      {
        address: "789 Pine Road, Vancouver, WA",
        sale_price_usd: 310000,
        gla_sqft: 1650,
        sale_date: "2023-07-10",
        source_table: "sqlite_demo",
      },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index >= mockData.length) {
        setIsStreaming(false);
        setStatus(`Import complete: ${mockData.length} records processed`);
        clearInterval(interval);
        return;
      }

      setStreamData((prev) => [mockData[index], ...prev]);
      setStatus(`Processing record ${index + 1} of ${mockData.length}`);
      index++;
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8"><>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Terrafusion Legacy Data Importer
          </h1>
          <p
</> className="text-gray-600">
            Import and transform legacy appraisal data with AI-powered validation
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"><>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h2>

          <div
</> className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".sqlite,.db,.csv,.xml,.zip"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="mb-4">
              <svg
                className="w-12 h-12 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div><>


            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p
</> className="text-sm text-gray-500 mb-4">
              Supports SQLite, CSV, XML, and ZIP archives
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Select Files
            </button>
          </div>

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mt-4"><>

              <h3 className="font-medium text-gray-900 mb-2">Selected Files:</h3>
              <ul
</> className="space-y-1">
                {Array.from(selectedFiles).map((file /* , index */) => (
                  <li key={index} className="text-sm text-gray-600">
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Live Import Stream */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div><>

                <h2 className="text-xl font-semibold text-gray-900">Live Import Stream</h2>
                <p
</> className="text-sm text-gray-500 mt-1">{status}</p>
              </div>

              <button
                onClick={startDemoStream}
                disabled={isStreaming}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isStreaming
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isStreaming ? "Processing..." : "Start Demo Import"}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {streamData.length === 0 && !isStreaming ? (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                ><>

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <p
</>>No imported records yet. Start a demo import to see live data streaming.</p>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="bg-gray-50 p-3 grid grid-cols-4 gap-3 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b"><>

                  <div>Property Address</div>
                  <div
</> className="text-right">Sale Price</div><>

                  <div className="text-center">Living Area</div>
                  <div
</> className="text-center">Sale Date</div>
                </div>

                {/* Data Rows */}
                {streamData.map((record /* , index */) => (
                  <div
                    key={index}
                    className="border-b p-3 grid grid-cols-4 gap-3 text-sm hover:bg-gray-50"
                  ><>

                    <div className="font-medium text-gray-900">{record.address}</div>
                    <div
</> className="text-right font-semibold text-green-700">
                      ${record.sale_price_usd?.toLocaleString()}
                    </div><>

                    <div className="text-center text-gray-900">
                      {record.gla_sqft?.toLocaleString()} sqft
                    </div>
                    <div
</> className="text-center text-gray-900">{record.sale_date}</div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isStreaming && (
                  <div className="p-4 text-center border-b">
                    <div className="flex items-center justify-center gap-2"><>

                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span
</> className="text-sm text-gray-600">Processing more records...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {streamData.length > 0 && (
            <div className="p-4 bg-gray-50 border-t">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><>

                  <span className="text-gray-500">Records Processed:</span>
                  <span
</> className="ml-2 font-semibold">{streamData.length}</span>
                </div>
                <div><>

                  <span className="text-gray-500">Average Price:</span>
                  <span
</> className="ml-2 font-semibold">
                    $
                    {Math.round(
                      streamData.reduce((sum, r) => sum + r.sale_price_usd, 0) / streamData.length
                    ).toLocaleString()}
                  </span>
                </div>
                <div><>

                  <span className="text-gray-500">Total Value:</span>
                  <span
</> className="ml-2 font-semibold">
                    ${streamData.reduce((sum, r) => sum + r.sale_price_usd, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
