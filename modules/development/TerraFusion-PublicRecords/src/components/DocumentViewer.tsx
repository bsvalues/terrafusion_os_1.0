import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Download, Printer, Search, ZoomIn, ZoomOut,
  RotateCw, Share2, Eye, Brain, CheckCircle, AlertCircle,
  File, Image, FileCode, FileSpreadsheet, Lock, Unlock,
  Clock, User, Hash, Layers, Type, Scan
 } from '@mui/icons-material';

interface DocumentViewerProps {
  document: any;
  onClose: () => void;
  onExtractText?: (text: string) => void;
}

interface ExtractedData {
  text: string;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  metadata: {
    pages?: number;
    author?: string;
    created?: Date;
    modified?: Date;
    size?: number;
  };
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  document, 
  onClose, 
  onExtractText 
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showOCR, setShowOCR] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  useEffect(() => {
    // Simulate loading document content
    loadDocument();
  }, [document]);

  const loadDocument = async () => {
    setIsProcessing(true);
    
    // Simulate document processing
    setTimeout(() => {
      // Mock document content based on type
      let content = '';
      let insights = [];
      
      if (document.type === 'permit' || document.name?.includes('permit')) {
        content = `BUILDING PERMIT APPLICATION
        
Property Address: 123 Main Street, Kennewick, WA 99336
Parcel Number: 12-34-56-789
Owner: John Doe
Contractor: ABC Construction LLC
License #: WA-2024-12345

PROJECT DESCRIPTION:
Construction of a 400 sq ft deck addition to single-family residence.
Work includes:
- Foundation and footings
- Framing and decking
- Railing installation
- Electrical for lighting

ESTIMATED COST: $15,000
START DATE: March 1, 2024
COMPLETION DATE: March 30, 2024

REQUIRED INSPECTIONS:
1. Foundation inspection
2. Framing inspection
3. Final inspection

FEES:
Base Permit Fee: $450
Plan Review Fee: $225
Total Due: $675`;

        insights = [
          { type: 'warning', message: 'Contractor license expires in 30 days' },
          { type: 'info', message: 'Similar permits average 21 days to approval' },
          { type: 'success', message: 'All required documents present' }
        ];
        
      } else if (document.type === 'property' || document.name?.includes('deed')) {
        content = `WARRANTY DEED
        
GRANTOR: Jane Smith
GRANTEE: John Doe and Mary Doe, husband and wife

LEGAL DESCRIPTION:
Lot 15, Block 3, Sunshine Estates, according to the plat thereof, 
recorded in Volume 45 of Plats, Page 123, records of Benton County, Washington.

PARCEL NUMBER: 12-34-56-789
ASSESSED VALUE: $385,000

This deed is subject to:
- Real estate taxes and assessments
- Easements and restrictions of record
- HOA covenants recorded under AFN 2020-12345

DATED this 15th day of January, 2024

________________________________
Jane Smith, Grantor

STATE OF WASHINGTON )
COUNTY OF BENTON    ) ss.
NOTARY PUBLIC`;

        insights = [
          { type: 'info', message: 'Property has active HOA covenants' },
          { type: 'success', message: 'Clear title, no liens detected' },
          { type: 'info', message: 'Last sale: $350,000 (2020)' }
        ];
      } else {
        content = `DOCUMENT CONTENT
        
Type: ${document.type || 'General Document'}
Name: ${document.name}
Date: ${new Date().toLocaleDateString()}
Size: ${document.size || '245 KB'}

[Document content would appear here]

This is a sample document viewer showing OCR and AI capabilities.
The system can extract text, identify entities, and provide insights.`;

        insights = [
          { type: 'info', message: 'Document successfully processed' }
        ];
      }
      
      setDocumentContent(content);
      setAiInsights(insights);
      
      // Simulate OCR extraction
      setExtractedData({
        text: content,
        entities: [
          { type: 'ADDRESS', value: '123 Main Street, Kennewick, WA', confidence: 0.98 },
          { type: 'PERSON', value: 'John Doe', confidence: 0.95 },
          { type: 'MONEY', value: '$15,000', confidence: 0.99 },
          { type: 'DATE', value: 'March 1, 2024', confidence: 0.97 },
          { type: 'PARCEL', value: '12-34-56-789', confidence: 1.0 }
        ],
        metadata: {
          pages: document.pages || 1,
          author: document.author || 'Unknown',
          created: new Date(),
          modified: new Date(),
          size: document.size || 245000
        }
      });
      
      setIsProcessing(false);
    }, 1500);
  };

  const performOCR = () => {
    setShowOCR(true);
    setIsProcessing(true);
    
    // Simulate OCR processing
    setTimeout(() => {
      setIsProcessing(false);
      if (onExtractText && extractedData) {
        onExtractText(extractedData.text);
      }
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create download link
    const blob = new Blob([documentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.name || 'document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.name,
        text: `Viewing document: ${document.name}`,
        url: window.location.href
      });
    } else {
      // Copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-300">$1</mark>');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex"
    >
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-80 bg-white h-full overflow-y-auto"
      >
        <div className="p-6 border-b"><>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Document Details</h2>
          <div
</>
className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /><>

              <span className="text-gray-600">Name:</span>
              <span
</>
className="font-medium text-gray-900">{document.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400" /><>

              <span className="text-gray-600">ID:</span>
              <span
</>
className="font-mono text-xs">{document.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" /><>

              <span className="text-gray-600">Modified:</span>
              <span
</>
</>>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /><>

              <span className="text-gray-600">Owner:</span>
              <span
</>
</>>{document.owner || 'You'}</span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><>

              <Brain className="w-5 h-5 text-purple-600" />
              AI Insights
            </h3>
            <div
</>
className="space-y-2">
              {aiInsights.map((insight /* , index */) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    insight.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                    insight.type === 'success' ? 'bg-green-50 text-green-800' :
                    'bg-blue-50 text-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {insight.type === 'warning' ? (
                      <AlertCircle className="w-4 h-4 mt-0.5" />
                    ) : insight.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 mt-0.5" />
                    ) : (
                      <Eye className="w-4 h-4 mt-0.5" />
                    )}
                    <span>{insight.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Entities */}
        {extractedData && extractedData.entities.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><>

              <Layers className="w-5 h-5 text-blue-600" />
              Extracted Data
            </h3>
            <div
</>
className="space-y-2">
              {extractedData.entities.map((entity /* , index */) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div><>

                    <span className="text-xs text-gray-500">{entity.type}</span>
                    <p
</>
className="font-medium text-gray-900">{entity.value}</p>
                  </div>
                  <span className="text-xs text-green-600">
                    {Math.round(entity.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OCR Controls */}
        <div className="p-6">
          <button
            onClick={performOCR}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Processing...
            ) : (
                <Scan className="w-5 h-5" />
                Extract Text (OCR)
            )}
          </button>
          
          {showOCR && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Text extracted successfully!</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-gray-900 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search in document..."
                  className="pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                ><>

                  <ZoomOut className="w-4 h-4" />
                </button>
                <span
</>
className="text-sm font-medium w-12 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Rotation */}
              <button
                onClick={() => setRotation((rotation + 90) % 360)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Page Navigation */}
              {(extractedData?.metadata?.pages || 1) > 1 && (
                <div className="flex items-center gap-2"><>

                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    ←
                  </button>
                  <span
</>
className="text-sm">
                    Page {currentPage} / {extractedData?.metadata?.pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(extractedData?.metadata?.pages || 1, currentPage + 1))}
                    disabled={currentPage === (extractedData?.metadata?.pages || 1)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Actions */}
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Print"
              ><>

                <Printer className="w-4 h-4" />
              </button>
              <button
</>

                onClick={handleDownload}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Download"
              ><>

                <Download className="w-4 h-4" />
              </button>
              <button
</>

                onClick={handleShare}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Share"
              ><>

                <Share2 className="w-4 h-4" />
              </button>
              <button
</>

                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Document Display */}
        <div className="flex-1 bg-gray-100 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'top center'
              }}
              className="bg-white shadow-2xl rounded-lg p-12 min-h-[800px]"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center h-96">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="w-16 h-16 text-purple-600" />
                  </motion.div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerm(documentContent).replace(/\n/g, '<br/>') 
                    }}
                    className="whitespace-pre-wrap font-mono text-sm leading-relaxed"
                  />
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-800 text-white px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Ready</span>
              {extractedData && (<>

                  <span>•</span>
                  <span
</>
</>>{extractedData.text.split(' ').length} words</span><>

                  <span>•</span>
                  <span
</>
</>>{extractedData.text.length} characters</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>OCR Engine Active</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};