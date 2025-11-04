'use client';

import React, { useState } from 'react';
import { AICopilot } from './AICopilot';
import { CodeEditor } from './CodeEditor';
import { FileExplorer } from './FileExplorer';
import { TaskRunner } from './TaskRunner';
import { Terminal } from './Terminal';

export const IDELayout: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [copilotMinimized, setCopilotMinimized] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showCopilot, setShowCopilot] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState('');

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Top Navigation Bar */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4">
        <h1 className="text-lg font-bold text-white">🚀 TerraFusion Developer Platform</h1>
        <div className="flex-1" />
        <span className="text-sm text-gray-400">Connected • 1,008 AI Agents Ready</span>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Explorer */}
        <div className="w-64 border-r border-gray-700 flex flex-col">
          <FileExplorer
            onFileSelect={path => {
              setSelectedFile(path);
              // Extract code from file for AI context
              setSelectedCode(`File: ${path}`);
            }}
            selectedFile={selectedFile || undefined}
          />
        </div>

        {/* Center: Code Editor */}
        <div className="flex-1 flex flex-col">
          <CodeEditor filePath={selectedFile || undefined} />
        </div>

        {/* Right Sidebar: AI Copilot + Tasks */}
        <div className="w-80 border-l border-gray-700 flex flex-col">
          {/* AI Copilot */}
          <div
            className={`${showCopilot && !copilotMinimized ? 'flex-1' : 'h-12'} flex flex-col border-b border-gray-700`}
          >
            {showCopilot && (
              <AICopilot
                selectedCode={selectedCode}
                onClose={() => setShowCopilot(false)}
                isMinimized={copilotMinimized}
              />
            )}
            {!showCopilot && (
              <div className="p-2 bg-gray-800 border-b border-gray-700">
                <button
                  onClick={() => setShowCopilot(true)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  + Show AI Copilot
                </button>
              </div>
            )}
          </div>

          {/* Task Runner */}
          <div className="flex-1 flex flex-col border-b border-gray-700">
            <TaskRunner onTaskOutput={setTerminalOutput} />
          </div>
        </div>
      </div>

      {/* Bottom Panel: Terminal */}
      <div className={`border-t border-gray-700 ${showTerminal ? 'h-48' : 'h-12'} flex flex-col`}>
        {showTerminal ? (
          <Terminal onClose={() => setShowTerminal(false)} isMinimized={terminalMinimized} />
        ) : (
          <div className="p-2 bg-gray-800 flex items-center justify-between">
            <button
              onClick={() => setShowTerminal(true)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Show Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
