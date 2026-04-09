/**
 * Code Highlighter
 * 
 * This component renders code with syntax highlighting.
 */

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Map of language codes to display names
const languageDisplayNames: Record<string, string> = {
  'typescript': 'TypeScript',
  'javascript': 'JavaScript',
  'python': 'Python',
  'java': 'Java',
  'csharp': 'C#',
  'go': 'Go',
  'sql': 'SQL',
  'html': 'HTML',
  'css': 'CSS'
};

interface CodeHighlighterProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  wrapLines?: boolean;
  showCopyButton?: boolean;
  className?: string;
}

export function CodeHighlighter({
  code,
  language = 'typescript',
  showLineNumbers = true,
  wrapLines = false,
  showCopyButton = true,
  className = ''
}: CodeHighlighterProps) {
  const [copied, setCopied] = useState<boolean>(false);
  
  // Reset the copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [copied]);
  
  // Copy code to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };
  
  // Format display language name
  const getDisplayLanguage = (lang: string): string => {
    return languageDisplayNames[lang] || lang;
  };
  
  // Split code into lines for line numbering
  const codeLines = code.split('\n');

  return (
    <div className={cn(
      'rounded-md border bg-muted/50',
      className
    )}>
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted">
        <span className="text-sm font-medium">
          {getDisplayLanguage(language)}
        </span>
        
        {showCopyButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyToClipboard}
            className="h-8 px-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                <span>Copy</span>
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className={cn(
        'p-4 font-mono text-sm overflow-x-auto',
        wrapLines && 'whitespace-pre-wrap'
      )}>
        {showLineNumbers ? (
          <table className="border-collapse w-full">
            <tbody>
              {codeLines.map((line, i) => (
                <tr key={i} className="leading-relaxed">
                  <td className="text-right pr-4 select-none opacity-50 border-r w-[1%] whitespace-nowrap">
                    {i + 1}
                  </td>
                  <td className={cn("pl-4", wrapLines ? "break-all" : "whitespace-pre")}>
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className={cn("p-0 m-0", wrapLines ? "whitespace-pre-wrap" : "whitespace-pre")}>
            {code}
          </pre>
        )}
      </div>
    </div>
  );
}