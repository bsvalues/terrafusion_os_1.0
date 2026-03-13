import React, { useState, useRef, useCallback, useEffect } from 'react';
import { execCanonCommand } from '@/api/canonFs';
import type { TerminalExecResponse } from '@/api/canonFs';

interface TerminalEntry {
  id: number;
  command: string;
  result?: TerminalExecResponse;
  pending: boolean;
}

const AVAILABLE_COMMANDS = [
  'type-check',
  'build:core-js',
  'check:generated',
  'test:phase83',
  'lint',
  'canon:doctor',
  'canon:gatefast',
  'canon:corpus-status',
] as const;

export default function CanonTerminal() {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [input, setInput] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [entries, scrollToBottom]);

  const handleSubmit = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd) return;

    // Built-in commands
    if (cmd === 'clear') {
      setEntries([]);
      setInput('');
      return;
    }
    if (cmd === 'help') {
      const id = nextId.current++;
      setEntries((prev) => [
        ...prev,
        {
          id,
          command: 'help',
          result: {
            command: 'help',
            exitCode: 0,
            stdout: `Available commands:\n  ${AVAILABLE_COMMANDS.join('\n  ')}\n\nBuiltins:\n  help     Show this message\n  clear    Clear terminal`,
            stderr: '',
            durationMs: 0,
          },
          pending: false,
        },
      ]);
      setInput('');
      setHistory((prev) => [...prev, cmd]);
      setHistoryIdx(-1);
      return;
    }

    const id = nextId.current++;
    setEntries((prev) => [...prev, { id, command: cmd, pending: true }]);
    setInput('');
    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);

    const result = await execCanonCommand(cmd);
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, result, pending: false } : e)),
    );
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        const idx = historyIdx < 0 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(idx);
        setInput(history[idx]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIdx < 0) return;
        const idx = historyIdx + 1;
        if (idx >= history.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(idx);
          setInput(history[idx]);
        }
      }
    },
    [handleSubmit, history, historyIdx],
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="canon-terminal" onClick={focusInput}>
      <div className="canon-terminal__output" ref={outputRef}>
        <div className="canon-terminal__welcome">
          TerraCanon Terminal — type <code>help</code> for commands
        </div>
        {entries.map((entry) => (
          <div key={entry.id} className="canon-terminal__entry">
            <div className="canon-terminal__prompt">
              <span className="canon-terminal__chevron">❯</span>
              <span className="canon-terminal__cmd">{entry.command}</span>
            </div>
            {entry.pending && (
              <div className="canon-terminal__pending">Running…</div>
            )}
            {entry.result && (
              <div
                className={`canon-terminal__result ${
                  entry.result.exitCode !== 0 ? 'canon-terminal__result--error' : ''
                }`}
              >
                {entry.result.error && (
                  <div className="canon-terminal__error">{entry.result.error}</div>
                )}
                {entry.result.stdout && (
                  <pre className="canon-terminal__stdout">{entry.result.stdout}</pre>
                )}
                {entry.result.stderr && (
                  <pre className="canon-terminal__stderr">{entry.result.stderr}</pre>
                )}
                <div className="canon-terminal__status">
                  exit {entry.result.exitCode}
                  {entry.result.durationMs > 0 && ` · ${(entry.result.durationMs / 1000).toFixed(1)}s`}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="canon-terminal__input-row">
        <span className="canon-terminal__chevron">❯</span>
        <input
          ref={inputRef}
          className="canon-terminal__input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="type-check, build:core-js, test:phase83, help…"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
