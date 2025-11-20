import { Plus, Terminal as TerminalIcon, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface TerminalProps {
  wsUrl?: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  wsUrl = 'ws://localhost:5000/api/terminal',
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
        addToHistory('Terminal connected', 'system');
      };

      socket.onmessage = (event) => {
        addToHistory(event.data, 'output');
      };

      socket.onerror = (error) => {
        addToHistory('WebSocket error', 'error');
        setIsConnected(false);
      };

      socket.onclose = () => {
        setIsConnected(false);
        addToHistory('Terminal disconnected', 'system');
      };

      setWs(socket);
    } catch (error) {
      console.error('Failed to connect to terminal:', error);
      addToHistory('Failed to connect to terminal', 'error');
    }
  };

  const addToHistory = (text: string, type: 'input' | 'output' | 'error' | 'system' = 'output') => {
    setHistory((prev) => [...prev, `[${type}] ${text}`]);
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || !ws || !isConnected) return;

    addToHistory(`$ ${currentInput}`, 'input');
    ws.send(JSON.stringify({ command: currentInput }));
    setCurrentInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  const clearTerminal = () => {
    setHistory([]);
  };

  return (
    <div className='h-full flex flex-col bg-terra-midnight'>
      {/* Terminal Header */}
      <div className='flex items-center justify-between px-4 py-2 border-b border-terra-cyan/20'>
        <div className='flex items-center space-x-2'>
          <TerminalIcon size={18} className='text-terra-cyan' />
          <span className='text-sm text-white'>Terminal</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className='flex items-center space-x-2'>
          <button
            onClick={clearTerminal}
            className='p-1 hover:bg-terra-cyan/20 rounded text-terra-cyan'
            title='Clear terminal (Ctrl+L)'
          >
            <X size={16} />
          </button>
          <button
            onClick={connectWebSocket}
            disabled={isConnected}
            className='p-1 hover:bg-terra-cyan/20 rounded text-terra-cyan disabled:opacity-50 disabled:cursor-not-allowed'
            title='New terminal'
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div ref={terminalRef} className='flex-1 overflow-y-auto p-4 font-mono text-sm'>
        {history.map((line, index) => {
          const [type, ...rest] = line.split('] ');
          const text = rest.join('] ');
          const cleanType = type.replace('[', '');

          return (
            <div
              key={index}
              className={`mb-1 ${
                cleanType === 'input'
                  ? 'text-terra-cyan'
                  : cleanType === 'error'
                    ? 'text-red-400'
                    : cleanType === 'system'
                      ? 'text-yellow-400'
                      : 'text-white'
              }`}
            >
              {text}
            </div>
          );
        })}
      </div>

      {/* Terminal Input */}
      <form onSubmit={handleSubmit} className='px-4 py-2 border-t border-terra-cyan/20'>
        <div className='flex items-center space-x-2 font-mono text-sm'>
          <span className='text-terra-cyan'>$</span>
          <input
            ref={inputRef}
            type='text'
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isConnected}
            placeholder={isConnected ? 'Type command...' : 'Terminal not connected'}
            className='flex-1 bg-transparent text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed'
            autoFocus
          />
        </div>
      </form>
    </div>
  );
};

export default Terminal;
