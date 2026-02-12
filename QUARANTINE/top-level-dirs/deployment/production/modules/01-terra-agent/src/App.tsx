import "./terrafusion-brand.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load agents on component mount
    loadAgents();
    
    // Add welcome message
    setMessages([{
      id: "welcome",
      content: "Welcome to TerraAgent! I'm your AI assistant for property analysis and market intelligence. How can I help you today?",
      role: "assistant",
      timestamp: new Date()
    }]);
  }, []);

  const loadAgents = async () => {
    try {
      const agentData = await invoke<{ agents: Agent[] }>("get_agents");
      setAgents(agentData.agents);
    } catch (error) {
      console.error("Failed to load agents:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      role: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await invoke<string>("process_query", { 
        query: inputValue 
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response,
        role: "assistant",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to process query:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "Sorry, I encountered an error processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container"><>

      <h1>TerraAgent Desktop</h1>
      <p
</>

</>>Your AI-powered property analysis assistant</p>

      {/* Agent Status Section */}
      <div className="agent-list">
        {agents.map((agent) => (
          <div key={agent.id} className="agent-card"><>

            <h3>{agent.name}</h3>
            <span
</>

className={`agent-status ${agent.status}`}>
              {agent.status}
            </span><>

            <p>{agent.description}</p>
            <small
</>

</>>Type: {agent.type}</small>
          </div>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}><>

              <div>{message.content}</div>
              <small
</>

</>>{message.timestamp.toLocaleTimeString()}</small>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="loading">Processing your request...</div>
            </div>
          )}
        </div>

        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about property analysis, market trends, or valuations..."
            disabled={isLoading}
          />
          <button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;