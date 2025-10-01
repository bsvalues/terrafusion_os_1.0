import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Search, Upload, Database, Brain, MessageCircle, Settings, BarChart3, FileText, Zap, Users } from 'lucide-react';
import { TerraFusionTheme, TFCard, TFButton, TFInput, TFSelect } from '../../../frontend/src/components/TerraFusion';

const RAGContainer = styled.div`
  ${TerraFusionTheme.getFullScreenLayout()}
  background: ${TerraFusionTheme.colors.background.main};
`;

const RAGHeader = styled.header`
  ${TerraFusionTheme.getHeaderLayout()}
  background: linear-gradient(135deg, 
    ${TerraFusionTheme.colors.primary.main}20 0%, 
    ${TerraFusionTheme.colors.accent.main}20 100%);
  border-bottom: 2px solid ${TerraFusionTheme.colors.primary.main}40;
`;

const RAGTitle = styled.h1`
  ${TerraFusionTheme.getPageTitle()}
  display: flex;
  align-items: center;
  gap: 15px;
  
  .icon {
    ${TerraFusionTheme.getIcon('32px')}
    color: ${TerraFusionTheme.colors.accent.main};
  }
`;

const RAGMain = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
`;

const RAGSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const RAGChatArea = styled.div`
  display: flex;
  flex-direction: column;
  background: ${TerraFusionTheme.colors.surface.main};
  border-radius: 12px;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  overflow: hidden;
`;

const RAGChatHeader = styled.div`
  padding: 15px 20px;
  background: ${TerraFusionTheme.colors.primary.main}20;
  border-bottom: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RAGChatMessages = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: calc(100vh - 300px);
`;

const RAGMessage = styled.div<{ type: 'user' | 'assistant' | 'system' }>`
  padding: 15px 20px;
  border-radius: 12px;
  max-width: 80%;
  word-wrap: break-word;
  
  ${props => props.type === 'user' && `
    background: ${TerraFusionTheme.colors.primary.main}20;
    border: 1px solid ${TerraFusionTheme.colors.primary.main}40;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  `}
  
  ${props => props.type === 'assistant' && `
    background: ${TerraFusionTheme.colors.accent.main}15;
    border: 1px solid ${TerraFusionTheme.colors.accent.main}30;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  `}
  
  ${props => props.type === 'system' && `
    background: ${TerraFusionTheme.colors.surface.dark};
    border: 1px solid ${TerraFusionTheme.colors.primary.main}20;
    align-self: center;
    font-style: italic;
    opacity: 0.8;
  `}
`;

const RAGInputArea = styled.div`
  padding: 20px;
  background: ${TerraFusionTheme.colors.surface.dark};
  border-top: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  display: flex;
  gap: 15px;
  align-items: flex-end;
`;

const RAGTextArea = styled.textarea`
  ${TerraFusionTheme.getInputStyle()}
  flex: 1;
  min-height: 60px;
  max-height: 120px;
  resize: vertical;
  font-family: inherit;
`;

const RAGModelCard = styled(TFCard)`
  .model-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .model-status {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.active ? TerraFusionTheme.colors.accent.main : TerraFusionTheme.colors.surface.light};
  }
  
  .model-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 15px;
    
    .stat {
      text-align: center;
      padding: 8px;
      background: ${TerraFusionTheme.colors.surface.dark};
      border-radius: 6px;
      border: 1px solid ${TerraFusionTheme.colors.primary.main}20;
      
      .label {
        font-size: 12px;
        color: ${TerraFusionTheme.colors.text.muted};
        display: block;
      }
      
      .value {
        font-size: 14px;
        font-weight: 600;
        color: ${TerraFusionTheme.colors.accent.main};
      }
    }
  }
`;

const RAGDocumentItem = styled.div`
  padding: 12px 15px;
  background: ${TerraFusionTheme.colors.surface.main};
  border: 1px solid ${TerraFusionTheme.colors.primary.main}20;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${TerraFusionTheme.colors.primary.main}15;
    border-color: ${TerraFusionTheme.colors.primary.main}40;
  }
  
  .doc-title {
    font-weight: 600;
    color: ${TerraFusionTheme.colors.text.primary};
    margin-bottom: 5px;
  }
  
  .doc-meta {
    font-size: 12px;
    color: ${TerraFusionTheme.colors.text.muted};
    display: flex;
    justify-content: space-between;
  }
`;

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: string[];
}

interface RAGModel {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'loading';
  parameters: string;
  speed: string;
  accuracy: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  size: string;
  modified: Date;
  indexed: boolean;
}

const RAGPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'RAGPanel initialized. ChromaDB connected. Ollama models loaded.',
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('llama2:13b');
  const [isLoading, setIsLoading] = useState(false);
  
  const [ragModels] = useState<RAGModel[]>([
    { id: 'llama2:13b', name: 'Llama 2 13B', status: 'active', parameters: '13B', speed: '45 t/s', accuracy: '94.2%' },
    { id: 'codellama:7b', name: 'Code Llama 7B', status: 'active', parameters: '7B', speed: '67 t/s', accuracy: '91.8%' },
    { id: 'mistral:7b', name: 'Mistral 7B', status: 'inactive', parameters: '7B', speed: '72 t/s', accuracy: '92.5%' },
  ]);
  
  const [documents] = useState<Document[]>([
    { id: '1', title: 'County Building Codes', type: 'PDF', size: '2.4 MB', modified: new Date(), indexed: true },
    { id: '2', title: 'Zoning Regulations 2024', type: 'PDF', size: '1.8 MB', modified: new Date(), indexed: true },
    { id: '3', title: 'Property Assessment Guidelines', type: 'DOCX', size: '956 KB', modified: new Date(), indexed: true },
    { id: '4', title: 'Environmental Impact Reports', type: 'PDF', size: '4.2 MB', modified: new Date(), indexed: false },
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    // Simulate RAG response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Based on the county documents in ChromaDB, I found relevant information about "${userMessage.content}". Here's what I discovered from the vector database search:\n\n• Found 3 relevant sections in Building Codes\n• Cross-referenced with Zoning Regulations\n• Retrieved historical precedents from Property Assessment Guidelines\n\nThe information shows that...`,
        timestamp: new Date(),
        sources: ['County Building Codes', 'Zoning Regulations 2024']
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <RAGContainer>
      <RAGHeader>
        <RAGTitle>
          <Brain className="icon" />
          RAGPanel - Advanced AI Knowledge System
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>ChromaDB Connected</span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>Ollama Active</span>
          </div>
        </RAGTitle>
      </RAGHeader>
      
      <RAGMain>
        {/* Left Sidebar - Models & Settings */}
        <RAGSidebar>
          <TFCard title="Active Models" icon={<Zap />}>
            {ragModels.map(model => (
              <RAGModelCard key={model.id} active={model.status === 'active'}>
                <div className="model-header">
                  <strong>{model.name}</strong>
                  <div className="model-status" />
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  Status: {model.status}
                </div>
                <div className="model-stats">
                  <div className="stat">
                    <span className="label">Parameters</span>
                    <span className="value">{model.parameters}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Speed</span>
                    <span className="value">{model.speed}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Accuracy</span>
                    <span className="value">{model.accuracy}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Status</span>
                    <span className="value">{model.status}</span>
                  </div>
                </div>
              </RAGModelCard>
            ))}
          </TFCard>
          
          <TFCard title="Query Settings" icon={<Settings />}>
            <TFSelect
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {ragModels.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </TFSelect>
            
            <div style={{ marginTop: '15px' }}>
              <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                Context Length: 4096 tokens
              </label>
              <input type="range" min="1024" max="8192" defaultValue="4096" 
                     style={{ width: '100%', marginTop: '5px' }} />
            </div>
            
            <div style={{ marginTop: '15px' }}>
              <label style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                Temperature: 0.7
              </label>
              <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" 
                     style={{ width: '100%', marginTop: '5px' }} />
            </div>
          </TFCard>
        </RAGSidebar>
        
        {/* Center - Chat Interface */}
        <RAGChatArea>
          <RAGChatHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageCircle size={20} />
              <span>Government Knowledge Assistant</span>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              Vector DB: {documents.filter(d => d.indexed).length} docs indexed
            </div>
          </RAGChatHeader>
          
          <RAGChatMessages>
            {messages.map(message => (
              <RAGMessage key={message.id} type={message.type}>
                <div>{message.content}</div>
                {message.sources && (
                  <div style={{ 
                    marginTop: '10px', 
                    fontSize: '12px', 
                    opacity: 0.7,
                    borderTop: `1px solid ${TerraFusionTheme.colors.primary.main}20`,
                    paddingTop: '8px'
                  }}>
                    Sources: {message.sources.join(', ')}
                  </div>
                )}
              </RAGMessage>
            ))}
            {isLoading && (
              <RAGMessage type="assistant">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: `2px solid ${TerraFusionTheme.colors.accent.main}40`,
                    borderTop: `2px solid ${TerraFusionTheme.colors.accent.main}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Searching vector database...
                </div>
              </RAGMessage>
            )}
            <div ref={messagesEndRef} />
          </RAGChatMessages>
          
          <RAGInputArea>
            <RAGTextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about county regulations, building codes, or any government policy..."
              disabled={isLoading}
            />
            <TFButton 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              Send
            </TFButton>
          </RAGInputArea>
        </RAGChatArea>
        
        {/* Right Sidebar - Document Management */}
        <RAGSidebar>
          <TFCard title="Document Library" icon={<Database />}>
            <TFButton 
              style={{ marginBottom: '15px', width: '100%' }}
              icon={<Upload />}
            >
              Upload Documents
            </TFButton>
            
            <TFInput 
              placeholder="Search documents..."
              icon={<Search />}
              style={{ marginBottom: '15px' }}
            />
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {documents.map(doc => (
                <RAGDocumentItem key={doc.id}>
                  <div className="doc-title">{doc.title}</div>
                  <div className="doc-meta">
                    <span>{doc.type} • {doc.size}</span>
                    <span style={{ 
                      color: doc.indexed ? TerraFusionTheme.colors.accent.main : TerraFusionTheme.colors.text.muted 
                    }}>
                      {doc.indexed ? 'Indexed' : 'Pending'}
                    </span>
                  </div>
                </RAGDocumentItem>
              ))}
            </div>
          </TFCard>
          
          <TFCard title="Query Analytics" icon={<BarChart3 />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>247</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Queries Today</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>94.2%</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Accuracy</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>2.3s</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Avg Response</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: TerraFusionTheme.colors.surface.dark, borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>12.4K</div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>Total Vectors</div>
              </div>
            </div>
          </TFCard>
        </RAGSidebar>
      </RAGMain>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </RAGContainer>
  );
};

export default RAGPanel;