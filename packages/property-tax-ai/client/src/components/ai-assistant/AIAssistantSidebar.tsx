import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAIAssistant, AIAssistantContextType } from '@/providers/ai-assistant-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const AIAssistantSidebar: React.FC = () => {
  const {
    messages,
    sendMessage,
    loading,
    selectedProvider,
    setSelectedProvider,
    availableProviders
  } = useAIAssistant();
  
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>('chat');

  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !loading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 rounded-full shadow-md z-50"
        onClick={toggleSidebar}
      >
        {isOpen ? <ChevronRight /> : <Bot />}
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen bg-white border-l border-gray-200 shadow-lg transition-all duration-300 z-40 flex flex-col ${
          isOpen ? 'w-80' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Bot size={20} />
            <span>AI Assistant</span>
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="chat" className="flex-1 flex flex-col" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 px-4 pt-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <Bot size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Ask me anything about property assessments!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      message.role === 'assistant' ? 'items-start' : 'items-end'
                    }`}
                  >
                    <Card
                      className={`px-4 py-2 max-w-[90%] ${
                        message.role === 'assistant'
                          ? 'bg-gray-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </Card>
                    <span className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-gray-200 p-4 pt-2"
            >
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || loading}
                >
                  <Send size={18} />
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="settings" className="p-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">AI Provider</h3>
                <Select
                  value={selectedProvider}
                  onValueChange={setSelectedProvider}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.map((provider: string) => (
                      <SelectItem key={provider} value={provider}>
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="help" className="p-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="font-medium">Quick Help Guide</h3>
              <p className="text-sm text-gray-600">
                The AI Assistant can help you with various property assessment tasks:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Answer questions about property assessment processes</li>
                <li>Explain property valuation methods</li>
                <li>Provide context about property data</li>
                <li>Help with navigating the property assessment system</li>
                <li>Explain tax calculations and assessment rates</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                The assistant uses AI to generate responses based on your questions and the current context.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAssistantSidebar;