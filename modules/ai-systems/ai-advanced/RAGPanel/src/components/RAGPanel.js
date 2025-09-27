"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.div = exports.RAGPanel = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const icons_material_1 = require("@mui/icons-material");
const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:\${{TF_ADMIN_PORT:-8080}}';
const RAGPanel = () => {
    const [health, setHealth] = (0, react_1.useState)(null);
    const [stats, setStats] = (0, react_1.useState)(null);
    const [query, setQuery] = (0, react_1.useState)('');
    const [queryResult, setQueryResult] = (0, react_1.useState)(null);
    const [isQuerying, setIsQuerying] = (0, react_1.useState)(false);
    const [uploadFile, setUploadFile] = (0, react_1.useState)(null);
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const [uploadStatus, setUploadStatus] = (0, react_1.useState)(null);
    // Fetch health status
    (0, react_1.useEffect)(() => {
        const fetchHealth = async () => {
            try {
                const response = await fetch(`${RAG_API_URL}/health`);
                const data = await response.json();
                setHealth(data);
            }
            catch (error) {
                console.error('Failed to fetch health:', error);
            }
        };
        fetchHealth();
        const interval = setInterval(fetchHealth, 5000);
        return () => clearInterval(interval);
    }, []);
    // Fetch stats
    (0, react_1.useEffect)(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${RAG_API_URL}/stats`);
                const data = await response.json();
                setStats(data);
            }
            catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);
    const handleQuery = async () => {
        if (!query.trim())
            return;
        setIsQuerying(true);
        setQueryResult(null);
        try {
            const response = await fetch(`${RAG_API_URL}/query`, { method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: query, n_results: 5 }),
            });
            const data = await response.json();
            setQueryResult(data);
        }
        catch (error) {
            console.error('Query failed:', error);
        }
        finally {
            setIsQuerying(false);
        }
    };
    const handleFileUpload = async () => {
        if (!uploadFile)
            return;
        setIsUploading(true);
        setUploadStatus(null);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('source', 'gui_upload');
        try {
            const response = await fetch(`${RAG_API_URL}/add_document`, { method: 'POST',
                body: formData, });
            const data = await response.json();
            if (data.success) {
                setUploadStatus({
                    success: true,
                    message: `Document uploaded successfully (ID: ${data.document_id?.substring(0, 8)}...)`,
                });
                setUploadFile(null);
                // Refresh stats to show new document count
                const statsResponse = await fetch(`${RAG_API_URL}/stats`);
                const statsData = await statsResponse.json();
                setStats(statsData);
            }
            else {
                setUploadStatus({
                    success: false,
                    message: data.error || 'Upload failed',
                });
            }
        }
        catch (error) {
            setUploadStatus({
                success: false,
                message: 'Network error during upload',
            });
        }
        finally {
            setIsUploading(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "p-6 bg-gray-50 dark:bg-gray-900 rounded-lg", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100", children: "Terrafusion RAG Knowledge Base" }), (0, jsx_runtime_1.jsx)("div", { className: "mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center", children: [(0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(icons_material_1.Activity, { className: "mr-2", size: 20 }), "System Health"] }), "h3>", (0, jsx_runtime_1.jsx)("div", {})] }), "className=", `flex items-center px-3 py-1 rounded-full text-sm font-medium ${health?.status === 'healthy'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`, ">", health?.status === 'healthy' ? ((0, jsx_runtime_1.jsx)(icons_material_1.CheckCircle, { size: 16, className: "mr-1" })) : ((0, jsx_runtime_1.jsx)(icons_material_1.AlertCircle, { size: 16, className: "mr-1" })), health?.status || 'Unknown'] }) }), health && ((0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 gap-4 mt-4 text-sm", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600 dark:text-gray-400", children: "Ollama:" }), (0, jsx_runtime_1.jsx)("span", {})] }), "className=", `ml-2 font-medium ${health.ollama_healthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`, ">", health.ollama_healthy ? 'Connected' : 'Disconnected'] }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600 dark:text-gray-400", children: "Embeddings:" }), (0, jsx_runtime_1.jsx)("span", {})] }), "className=", `ml-2 font-medium ${health.embedding_healthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`, ">", health.embedding_healthy ? 'Ready' : 'Not Ready'] }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600 dark:text-gray-400", children: "Storage:" }), (0, jsx_runtime_1.jsx)("span", {})] }), "className=\"ml-2 font-medium text-gray-800 dark:text-gray-200\">", health.storage_type] }));
    exports.div > (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600 dark:text-gray-400", children: "Documents:" }), (0, jsx_runtime_1.jsx)("span", {})] }), "className=\"ml-2 font-medium text-gray-800 dark:text-gray-200\">", stats?.document_count || 0] });
    exports.div > ;
    exports.div > ;
};
exports.RAGPanel = RAGPanel;
 > { /* File Upload */} < exports.div;
className = "mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow" > (0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center", children: [(0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(icons_material_1.Upload, { className: "mr-2", size: 20 }), "Upload Document"] }), "h3>", (0, jsx_runtime_1.jsx)("div", {})] });
className = "flex items-center space-x-4" > ((0, jsx_runtime_1.jsx)("input", { type: "file", accept: ".txt,.md,.json,.csv", onChange: (e) => setUploadFile(e.target.files?.[0] || null), className: "flex-1 text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleFileUpload, disabled: !uploadFile || isUploading, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors", children: isUploading ? 'Uploading...' : 'Upload' }));
exports.div > { uploadStatus } && ((0, jsx_runtime_1.jsx)("div", { className: `mt-3 p-3 rounded-lg text-sm ${uploadStatus.success
        ? 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-200'
        : 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`, children: uploadStatus.message }));
exports.div > { /* Query Interface */} < exports.div;
className = "mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow" > (0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center", children: [(0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(icons_material_1.Search, { className: "mr-2", size: 20 }), "Query Knowledge Base"] }), "h3>", (0, jsx_runtime_1.jsx)("div", {})] });
className = "flex space-x-4" > ((0, jsx_runtime_1.jsx)("input", { type: "text", value: query, onChange: (e) => setQuery(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleQuery(), placeholder: "Ask a question about your documents...", className: "flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleQuery, disabled: !query.trim() || isQuerying, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors", children: isQuerying ? 'Searching...' : 'Search' }));
exports.div > ;
exports.div > { /* Query Results */};
{
    queryResult && (((0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-white dark:bg-gray-800 rounded-lg shadow", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center", children: [(0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(icons_material_1.FileText, { className: "mr-2", size: 20 }), "Results"] }), "h3>", (0, jsx_runtime_1.jsx)("div", {})] }), "className=\"space-y-4\">", (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Answer:" }), (0, jsx_runtime_1.jsx)("p", {})] }), "className=\"text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-3 rounded\">", queryResult.answer] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400", children: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Confidence: ", (queryResult.confidence * 100).toFixed(1), "%"] }), (0, jsx_runtime_1.jsx)("span", {})] }) })) > Query);
    time: {
        queryResult.query_time_ms;
    }
    ms;
    span > (0, jsx_runtime_1.jsxs)("span", { children: ["Sources: ", queryResult.sources.length] });
    exports.div > { queryResult, : .sources.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Sources:" }), (0, jsx_runtime_1.jsx)("div", {})] }), "className=\"space-y-2\">", queryResult.sources.map((source, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-gray-700 dark:text-gray-300", children: source.content_preview }), source.metadata.filename && ((0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-500", children: ["Source: ", source.metadata.filename] }))] }, idx)))] })), div: exports.div } > ;
}
exports.div > ;
exports.div > ;
exports.div >
;
;
;
//# sourceMappingURL=RAGPanel.js.map