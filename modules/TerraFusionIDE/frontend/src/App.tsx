import { useState } from 'react';
import styled from 'styled-components';
import { Editor } from '@monaco-editor/react';
import { 
  Play, 
  Save, 
  Settings, 
  Code, 
  Workflow, 
  BarChart3, 
  Rocket,
  Zap,
  Brain
} from 'lucide-react';
import { 
  TerraFusionGlobalStyles,
  TFButton,
  TFFlex,
  TFHeading
} from './components/SimpleTerraFusion';
import { FileExplorer } from './components/FileExplorer';
import { VisualWorkflowDesigner } from './components/VisualWorkflowDesigner';
import { GovernmentAnalyticsStudio } from './components/GovernmentAnalyticsStudio';
import { FileNode } from './services/FileSystemService';

const IDEContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--tf-color-dark);
`;

const Header = styled.header`
  background: rgba(26, 31, 58, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 153, 255, 0.2);
  padding: var(--tf-spacing-md);
`;

const EditorContainer = styled.div`
  flex: 1;
  display: flex;
`;

const Sidebar = styled.div`
  width: 300px;
  background: rgba(26, 31, 58, 0.8);
  border-right: 1px solid rgba(0, 153, 255, 0.2);
  padding: var(--tf-spacing-md);
`;

const MainEditor = styled.div`
  flex: 1;
  background: var(--tf-color-dark);
`;

function App() {
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [activeView, setActiveView] = useState<'code' | 'workflow' | 'analytics' | 'deploy'>('code');
  const [aiAssistantActive, setAiAssistantActive] = useState(false);
  const defaultCode = `// TerraFusion OS Module Development
// Welcome to the TerraFusion IDE

import { TerraFusionModule } from '@terrafusion/core';

class MyGovernmentModule extends TerraFusionModule {
  constructor() {
    super({
      id: 'my-government-module',
      name: 'My Government Module',
      version: '1.0.0',
      category: 'government-core'
    });
  }

  async initialize() {
    console.log('Initializing government module...');
    
    // Module initialization logic
    this.registerEndpoints();
    this.setupDatabase();
    this.initializeUI();
  }

  registerEndpoints() {
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'operational',
        message: 'Government. Transcended.'
      });
    });
  }

  setupDatabase() {
    // Government-grade database setup
  }

  initializeUI() {
    // React component initialization
  }
}

export default MyGovernmentModule;
`;

  return (
    <>
      <TerraFusionGlobalStyles />
      <IDEContainer>
        <Header>
          <TFFlex justify="space-between" align="center">
            <TFFlex align="center" gap="var(--tf-spacing-md)">
              <div style={{
                fontSize: '2rem',
                background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                💻
              </div>
              <div>
                <TFHeading level={3} gradient style={{ margin: 0 }}>
                  TerraFusion IDE
                </TFHeading>
                <p style={{ 
                  color: 'var(--tf-color-gray)', 
                  fontSize: '0.875rem',
                  margin: 0 
                }}>
                  Government Development Environment
                </p>
              </div>
            </TFFlex>
            
            <TFFlex gap="var(--tf-spacing-sm)">
              {/* View Navigation */}
              <TFButton 
                variant={activeView === 'code' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('code')}
              >
                <Code size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Code
              </TFButton>
              
              <TFButton 
                variant={activeView === 'workflow' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('workflow')}
              >
                <Workflow size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Workflow
              </TFButton>
              
              <TFButton 
                variant={activeView === 'analytics' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('analytics')}
              >
                <BarChart3 size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Analytics
              </TFButton>
              
              <TFButton 
                variant={activeView === 'deploy' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('deploy')}
              >
                <Rocket size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Deploy
              </TFButton>

              {/* Action Buttons */}
              <div style={{ width: '1px', height: '24px', background: 'rgba(0, 153, 255, 0.3)', margin: '0 var(--tf-spacing-sm)' }} />
              
              <TFButton 
                variant={aiAssistantActive ? 'accent' : 'secondary'}
                onClick={() => setAiAssistantActive(!aiAssistantActive)}
              >
                <Brain size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                AI Assistant
              </TFButton>
              
              <TFButton variant="secondary">
                <Save size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Save
              </TFButton>
              
              <TFButton variant="primary">
                <Play size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Run
              </TFButton>
              
              <TFButton variant="ghost">
                <Settings size={18} />
              </TFButton>
            </TFFlex>
          </TFFlex>
        </Header>

        <EditorContainer>
          {/* Render different views based on activeView */}
          {activeView === 'code' && (
            <>
              <Sidebar>
                <FileExplorer
                  onFileSelect={setCurrentFile}
                  onFileContent={setEditorContent}
                  selectedFile={currentFile?.path}
                />
                
                {aiAssistantActive && (
                  <div style={{ marginTop: 'var(--tf-spacing-lg)' }}>
                    <TFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                      🤖 AI Code Assistant
                    </TFHeading>
                    
                    <div style={{
                      padding: 'var(--tf-spacing-md)',
                      background: 'rgba(0, 255, 238, 0.1)',
                      border: '1px solid var(--tf-color-transcend)',
                      borderRadius: 'var(--tf-radius-md)',
                      fontSize: '0.875rem'
                    }}>
                      <div style={{ marginBottom: 'var(--tf-spacing-sm)', color: 'var(--tf-color-transcend)' }}>
                        AI Suggestions:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--tf-color-gray)' }}>
                        <li>Add error handling to function</li>
                        <li>Optimize for government compliance</li>
                        <li>Generate unit tests</li>
                        <li>Add TypeScript types</li>
                      </ul>
                      
                      <TFButton 
                        variant="ghost" 
                        size="sm" 
                        fullWidth 
                        style={{ marginTop: 'var(--tf-spacing-sm)' }}
                      >
                        <Zap size={14} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                        Apply AI Suggestions
                      </TFButton>
                    </div>
                  </div>
                )}
              </Sidebar>

              <MainEditor>
                <Editor
                  height="100%"
                  language={getLanguageFromFile(currentFile?.name || '')}
                  value={editorContent || defaultCode}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: true,
                    folding: true,
                    lineDecorationsWidth: 20,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'all',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                  }}
                  onChange={(value) => setEditorContent(value || '')}
                />
              </MainEditor>
            </>
          )}

          {activeView === 'workflow' && (
            <div style={{ width: '100%' }}>
              <VisualWorkflowDesigner />
            </div>
          )}

          {activeView === 'analytics' && (
            <div style={{ width: '100%' }}>
              <GovernmentAnalyticsStudio />
            </div>
          )}

          {activeView === 'deploy' && (
            <div style={{ width: '100%', padding: 'var(--tf-spacing-lg)' }}>
              <TFHeading level={3} gradient style={{ marginBottom: 'var(--tf-spacing-lg)' }}>
                🚀 One-Click County Deployment
              </TFHeading>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--tf-spacing-lg)'
              }}>
                <div>
                  <TFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                    Available Counties
                  </TFHeading>
                  
                  {['Benton County', 'Yakima County', 'Franklin County', 'Staging Environment'].map(county => (
                    <div
                      key={county}
                      style={{
                        padding: 'var(--tf-spacing-md)',
                        background: 'rgba(26, 31, 58, 0.8)',
                        border: '1px solid rgba(0, 153, 255, 0.2)',
                        borderRadius: 'var(--tf-radius-md)',
                        marginBottom: 'var(--tf-spacing-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 'var(--tf-spacing-xs)' }}>
                        {county}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--tf-color-gray)' }}>
                        Status: <span style={{ color: 'var(--tf-color-success)' }}>Healthy</span> | 
                        Modules: <span style={{ color: 'var(--tf-color-accent)' }}>15</span> | 
                        Version: <span style={{ color: 'var(--tf-color-primary)' }}>1.0.0</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div>
                  <TFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                    Deployment Pipeline
                  </TFHeading>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--tf-spacing-md)'
                  }}>
                    <TFButton variant="primary" fullWidth>
                      <Rocket size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                      Deploy Current Module
                    </TFButton>
                    
                    <TFButton variant="accent" fullWidth>
                      <Zap size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                      AI-Optimized Deploy
                    </TFButton>
                    
                    <TFButton variant="secondary" fullWidth>
                      <BarChart3 size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                      View Deployment History
                    </TFButton>
                  </div>
                </div>
              </div>
            </div>
          )}
        </EditorContainer>
      </IDEContainer>
    </>
  );
}

// Helper function to determine language from file extension
function getLanguageFromFile(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    case 'cs':
      return 'csharp';
    default:
      return 'typescript';
  }
}

export default App;