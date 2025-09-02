import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Play, 
  Save, 
  Upload, 
  Download, 
  Settings, 
  MessageSquare, 
  Search,
  Lightbulb,
  Database,
  Building2,
  FileText,
  Zap
 } from '@mui/icons-material';

// Types for RAG integration
interface RAGResponse {
  answer: string;
  sources: Array<{
    type: string;
    parcel_id?: string;
    code_id?: string;
    title?: string;
    confidence?: number;
  }>;
  confidence: number;
  query_processed: string;
}

interface CountyContext {
  properties_count: number;
  regulations_count: number;
  total_documents: number;
  last_updated: string;
}

const TerraFusionIDE: React.FC = () => {
  // Editor state
  const [code, setCode] = useState(`// Welcome to Terrafusion IDE
// AI-powered development environment for Benton County systems

// Example: Property Assessment Query
async function getPropertyValue(parcelId: string) {
  try {
    const response = await fetch('/api/properties/' + parcelId);
    const property = await response.json();
    
    console.log(\`Property \${parcelId} is valued at $\${property.assessed_value}\`);
    return property;
  } catch (error) {
    console.error('Error fetching property:', error);
  }
}

// Example: Building Code Compliance Check
function checkBuildingCompliance(setback: number, zoning: string) {
  if (zoning === 'R-1' && setback < 20) {
    return 'Non-compliant: R-1 zoning requires 20ft street setback';
  }
  return 'Compliant with county regulations';
}

// Ask the AI assistant about county regulations, property data, or coding help!`);

  // AI Assistant state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<RAGResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [countyContext, setCountyContext] = useState<CountyContext | null>(null);

  // Editor settings
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [showMinimap, setShowMinimap] = useState(true);

  // Panel visibility
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showContextPanel, setShowContextPanel] = useState(true);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Initialize county context on mount
  useEffect(() => {
    fetchCountyContext();
  }, []);

  const fetchCountyContext = async () => {
    try {
      const response = await fetch('http://localhost:8080/rag/stats');
      if (response.ok) {
        const stats = await response.json();
        setCountyContext(stats);
      }
    } catch (error) {
      console.error('Failed to fetch county context:', error);
    }
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor;
    
    // Register custom county-aware autocomplete
    monaco.languages.registerCompletionItemProvider('typescript', {
      provideCompletionItems: (model, position, context, token) => {
        const suggestions = [
          {
            label: 'queryProperty',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'queryProperty(${1:parcelId})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Query Benton County property information by parcel ID',
            range: monaco.Range.fromPositions(position)
          },
          {
            label: 'checkZoning',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'checkZoning(${1:address}, ${2:proposedUse})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Check zoning compliance for a property address',
            range: monaco.Range.fromPositions(position)
          },
          {
            label: 'calculateTaxes',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'calculateTaxes(${1:assessedValue}, ${2:taxRate})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Calculate property taxes based on assessed value',
            range: monaco.Range.fromPositions(position)
          },
          {
            label: 'validateSetbacks',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'validateSetbacks(${1:frontSetback}, ${2:sideSetback}, ${3:zoningCode})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Validate building setbacks against county regulations',
            range: monaco.Range.fromPositions(position)
          }
        ];
        
        return { suggestions };
      }
    });

    // Add county-specific code actions
    monaco.languages.registerCodeActionProvider('typescript', {
      provideCodeActions: (model, range, context, token) => {
        const actions = [];
        
        // Suggest RAG query for unknown functions
        if (context.markers.some(marker => marker.message.includes('Cannot find name'))) {
          actions.push({
            title: '🏛️ Ask County AI Assistant',
            kind: 'quickfix',
            edit: {
              edits: [{
                resource: model.uri,
                edit: {
                  range: range,
                  text: '// Ask AI: How do I implement this for Benton County?'
                }
              }]
            }
          } as any);
        }
        
        return { actions, dispose: () => {} };
      }
    });
  };

  const queryRAG = async (question: string): Promise<RAGResponse> => {
    const response = await fetch('http://localhost:8080/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    
    if (!response.ok) {
      throw new Error(`RAG query failed: ${response.status}`);
    }
    
    return response.json();
  };

  const handleAIQuery = async () => {
    if (!aiQuestion.trim()) return;
    
    setIsQuerying(true);
    try {
      // Enhance question with code context if available
      const currentCode = editorRef.current?.getValue() || '';
      const contextualQuestion = currentCode 
        ? `${aiQuestion}\n\nCurrent code context:\n${currentCode.slice(-500)}`
        : aiQuestion;
      
      const response = await queryRAG(contextualQuestion);
      setAiResponse(response);
    } catch (error) {
      console.error('AI query failed:', error);
      setAiResponse({
        answer: `Error: Could not connect to County AI Assistant. Please ensure the RAG service is running at http://localhost:8080`,
        sources: [],
        confidence: 0,
        query_processed: new Date().toISOString()
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const insertCodeSuggestion = (suggestion: string) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const range = selection || new monaco.Range(1, 1, 1, 1);
      
      editorRef.current.executeEdits('ai-suggestion', [{
        range: range,
        text: `\n// AI Suggestion:\n${suggestion}\n`
      }]);
    }
  };

  const saveCode = () => {
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terrafusion-code.ts';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runCode = async () => {
    // Simulate code execution - in a real implementation, this would send to a backend
    console.log('Executing Terrafusion code:', code);
    alert('Code execution simulated! Check the browser console for output.');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Main Editor Panel */}
      <div className="flex-1 flex flex-col">
        {/* IDE Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="w-6 h-6 text-blue-400" /><>

              <h1 className="text-xl font-bold">Terrafusion IDE</h1>
              <span
</> className="text-sm text-gray-400">Benton County Development Environment</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={runCode}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Run</span>
              </button>
              
              <button
                onClick={saveCode}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              
              <button
                onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Theme</span>
              </button>
            </div>
          </div>
        </div>

        {/* County Context Bar */}
        {countyContext && (
          <div className="bg-blue-900/30 border-b border-blue-700/50 p-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <Database className="w-4 h-4 text-blue-400" /><>

                <span>County Data: {countyContext.total_documents} documents</span>
                <span
</>>Properties: {countyContext.properties_count}</span>
                <span>Regulations: {countyContext.regulations_count}</span>
              </div>
              <div className="text-gray-400">
                Updated: {new Date(countyContext.last_updated).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language="typescript"
            theme={theme}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: fontSize,
              minimap: { enabled: showMinimap },
              wordWrap: 'on',
              automaticLayout: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              tabCompletion: 'on',
              parameterHints: { enabled: true },
              quickSuggestions: true,
              folding: true,
              lineNumbers: 'on',
              glyphMargin: true,
              contextmenu: true,
              scrollBeyondLastLine: false
            }}
          />
        </div>
      </div>

      {/* AI Assistant Panel */}
      {showAIPanel && (
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold">County AI Assistant</h3>
              </div>
              <button
                onClick={() => setShowAIPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-700">
            <div className="space-y-3">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask about county regulations, property data, or coding help..."
                className="w-full h-20 p-3 bg-gray-700 border border-gray-600 rounded-md resize-none focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAIQuery();
                  }
                }}
              />
              
              <button
                onClick={handleAIQuery}
                disabled={isQuerying || !aiQuestion.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {isQuerying ? (
                  <><>

                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span
</>>Thinking...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Ask AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Response */}
          <div className="flex-1 overflow-y-auto p-4">
            {aiResponse && (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2"><>

                    <span className="text-sm font-medium text-blue-400">AI Response</span>
                    <span
</> className="text-xs text-gray-400">
                      Confidence: {(aiResponse.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-gray-300 whitespace-pre-wrap">{aiResponse.answer}</p>
                  </div>

                  {aiResponse.answer.includes('function') || aiResponse.answer.includes('const') || aiResponse.answer.includes('interface') ? (
                    <button
                      onClick={() => insertCodeSuggestion(aiResponse.answer)}
                      className="mt-3 flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Insert Code</span>
                    </button>
                  ) : null}
                </div>

                {/* Sources */}
                {aiResponse.sources && aiResponse.sources.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-400">Sources:</h4>
                    {aiResponse.sources.slice(0, 3).map((source /* , index */) => (
                      <div key={index} className="bg-gray-700/50 rounded p-2 text-xs">
                        <div className="flex items-center space-x-2">
                          {source.type === 'property' ? (
                            <Building2 className="w-3 h-3 text-blue-400" />
                          ) : (
                            <FileText className="w-3 h-3 text-green-400" />
                          )}
                          <span className="text-gray-300">
                            {source.type === 'property' ? `Property ${source.parcel_id}` : source.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-medium text-gray-400">Quick Actions:</h4>
              
              {[
                "How do I query property values?",
                "Show me building code requirements",
                "Generate a tax calculation function",
                "What are the zoning classifications?",
                "Create a permit validation function"
              ].map((suggestion /* , index */) => (
                <button
                  key={index}
                  onClick={() => {
                    setAiQuestion(suggestion);
                    handleAIQuery();
                  }}
                  className="w-full text-left text-xs p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Show AI Panel button when hidden */}
      {!showAIPanel && (
        <button
          onClick={() => setShowAIPanel(true)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 p-3 rounded-l-lg transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default TerraFusionIDE;
