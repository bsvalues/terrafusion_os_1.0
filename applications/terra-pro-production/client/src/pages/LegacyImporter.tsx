import { useState, useRef, useEffect } from "react";
import ImportRow from "../components/ImportRow";

interface TerraFusionComp {
  address: string;
  sale_price_usd: number;
  gla_sqft: number;
  sale_date: string;
  source_table: string;
  bedrooms?: number;
  bathrooms?: number;
  lot_size_sqft?: number;
  year_built?: number;
  property_type?: string;
}

interface ImportJob {
  id: string;
  fileName: string;
  status: "pending" | "processing" | "complete" | "error";
  progress: number;
  recordsProcessed: number;
  totalRecords: number;
  error?: string;
}

export default function LegacyImporter() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [importedComps, setImportedComps] = useState<TerraFusionComp[]>([]);
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    console.log("Legacy Importer Component Successfully Mounted");

    return () => {
      // Cleanup event source on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
    setUploadStatus("");
  };

  const startMockStream = () => {
    setImportedComps([]);
    setIsStreaming(true);
    setStreamConnected(false);
    setUploadStatus("Starting import of authentic SQLite appraisal data...");

    // Import the real converted SQLite data
    fetch("/api/legacy/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((result) => {
        setUploadStatus(
          `Import completed: ${result.importedProperties} properties imported from ${result.totalFiles} records`
        );
        setIsStreaming(false);
        setStreamConnected(true);
      })
      .catch((error) => {
        setUploadStatus(`Import failed: ${error.message}`);
        setIsStreaming(false);
      });

    // Simulate the EventSource for now
    const eventSource = { close: () => {} } as EventSource;
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStreamConnected(true);
      setUploadStatus("Connected to import stream");
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "record") {
          setImportedComps((prev) => [message.data, ...prev]);
        } else if (message.type === "end") {
          setIsStreaming(false);
          setUploadStatus(
            `Import ${message.result}: ${importedComps.length + 1} records processed`
          );
          eventSource.close();
        }
      } catch (error) {
        console.error("Error parsing stream data:", error);
      }
    };

    eventSource.onerror = () => {
      setStreamConnected(false);
      setIsStreaming(false);
      setUploadStatus("Stream connection error");
      eventSource.close();
    };
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadStatus("Please select files first");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading files...");

    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/legacy-import/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSelectedFiles(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setUploadStatus("Files uploaded successfully!");
      } else {
        setUploadStatus("Upload failed - please try again");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("Upload failed - network error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8"><>

          <h1 className="text-3xl font-bold text-gray-900">Terrafusion Legacy Data Importer</h1>
          <p
</> className="mt-2 text-gray-600">
            Import data from legacy appraisal systems including SQLite databases, XML files, and
            various formats
          </p>
        </div>

        {/* Main Upload Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><>

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h2
</> className="text-xl font-semibold text-gray-900">Upload Legacy Files</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Select files from your legacy appraisal system. Supported formats include SQLite
            databases (.sqlite, .db), XML files, CSV files, and compressed archives (.zip).
          </p>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".sqlite,.db,.sqlite3,.xml,.csv,.zip,.sql,.xlsx,.xls,.pdf"
            />

            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><>

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>

            <button
</>
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors mb-2"
            >
              Select Files
            </button>

            <p className="text-sm text-gray-500">Or drag and drop files here</p>
          </div>

          {/* Selected Files Display */}
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg"><>

              <h3 className="font-medium text-gray-900 mb-3">
                Selected Files ({selectedFiles.length}):
              </h3>
              <div
</> className="space-y-2">
                {Array.from(selectedFiles).map((file /* , index */) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      ><>

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span
</> className="text-sm font-medium text-gray-900">{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`mt-4 w-full py-2 px-4 rounded-md text-white font-medium ${
                  isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                } transition-colors`}
              >
                {isUploading ? "Uploading..." : "Upload Files"}
              </button>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus && (
            <div
              className={`mt-4 p-3 rounded-md ${
                uploadStatus.includes("successfully")
                  ? "bg-green-100 text-green-800"
                  : uploadStatus.includes("failed") || uploadStatus.includes("error")
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {uploadStatus}
            </div>
          )}

          {/* Support Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              ><>

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 1.79 4 4 4h8c0-2.21-1.79-4-4-4H8c-2.21 0-4-1.79-4-4zm16 0c0-2.21-1.79-4-4-4H8c0 2.21 1.79 4 4 4h8c2.21 0 4 1.79 4 4z"
                />
              </svg>
              <div
</>><>

                <h3 className="font-medium text-blue-900 mb-1">Supported Systems</h3>
                <p
</> className="text-sm text-blue-800">
                  TOTAL by a la mode, ClickForms, ACI DataMaster, CompsImporter backups, and other
                  legacy appraisal software databases.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Import Stream Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div><>

                <h2 className="text-xl font-semibold text-gray-900">Live Import Stream</h2>
                <p
</> className="text-sm text-gray-500 mt-1">
                  Real-time processing with AI validation
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><>

                  <div
                    className={`w-2 h-2 rounded-full ${
                      streamConnected
                        ? "bg-green-500"
                        : isStreaming
                          ? "bg-yellow-500"
                          : "bg-gray-300"
                    }`}
                  ></div>
                  <span
</> className="text-sm text-gray-600">
                    {streamConnected ? "Connected" : isStreaming ? "Connecting..." : "Disconnected"}
                  </span>
                </div>
                <button
                  onClick={startMockStream}
                  disabled={isStreaming}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isStreaming
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isStreaming ? "Processing..." : "Import SQLite Data"}
                </button>
              </div>
            </div>
          </div>

          {/* Stream Data Display */}
          <div className="max-h-96 overflow-y-auto">
            {importedComps.length === 0 && !isStreaming ? (
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
</>>No imported records yet. Start an import to see live data streaming.</p>
              </div>
            ) : (
              <div>
                {/* Header Row */}
                <div className="bg-gray-50 p-3 grid grid-cols-6 gap-3 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b"><>

                  <div>Property Address</div>
                  <div
</> className="text-right">Sale Price</div><>

                  <div className="text-center">Living Area</div>
                  <div
</> className="text-center">Sale Date</div><>

                  <div>Validation Issues</div>
                  <div
</> className="text-right">Status</div>
                </div>

                {/* Data Rows */}
                {importedComps.map((comp /* , index */) => (
                  <ImportRow key={index} comp={comp} />
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

          {/* Stream Summary */}
          {importedComps.length > 0 && (
            <div className="p-4 bg-gray-50 border-t">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div><>

                  <span className="text-gray-500">Records Processed:</span>
                  <span
</> className="ml-2 font-semibold">{importedComps.length}</span>
                </div>
                <div><>

                  <span className="text-gray-500">Valid Records:</span>
                  <span
</> className="ml-2 font-semibold text-green-600">
                    {
                      importedComps.filter((comp) => {
                        // This would use the actual validation function
                        return comp.address && comp.sale_price_usd && comp.gla_sqft;
                      }).length
                    }
                  </span>
                </div>
                <div><>

                  <span className="text-gray-500">Issues Found:</span>
                  <span
</> className="ml-2 font-semibold text-yellow-600">
                    {
                      importedComps.filter((comp) => {
                        // This would use the actual validation function
                        return !comp.address || !comp.sale_price_usd || !comp.gla_sqft;
                      }).length
                    }
                  </span>
                </div>
                <div><>

                  <span className="text-gray-500">Avg Price/Sqft:</span>
                  <span
</> className="ml-2 font-semibold">
                    $
                    {importedComps.reduce((sum, comp) => {
                      if (comp.sale_price_usd && comp.gla_sqft) {
                        return sum + comp.sale_price_usd / comp.gla_sqft;
                      }
                      return sum;
                    }, 0) / importedComps.filter((c) => c.sale_price_usd && c.gla_sqft).length || 0}
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
