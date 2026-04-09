/**
 * Plandex AI Bug Fixer
 * 
 * This component provides a UI for fixing bugs in code using Plandex AI.
 * It allows users to input buggy code and an error message to get a fixed version.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bug, CheckCircle2, Code, ArrowRight } from 'lucide-react';
import { usePlandexAI } from '@/providers/plandex-ai-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CodeHighlighter } from '@/components/development/CodeHighlighter';

interface PlandexAIBugFixerProps {
  initialCode?: string;
  initialError?: string;
  onFixedCode?: (code: string) => void;
  className?: string;
}

export function PlandexAIBugFixer({ 
  initialCode = '',
  initialError = '',
  onFixedCode,
  className = ''
}: PlandexAIBugFixerProps) {
  // State
  const [buggyCode, setBuggyCode] = useState<string>(initialCode);
  const [errorMessage, setErrorMessage] = useState<string>(initialError);
  const [language, setLanguage] = useState<string>('typescript');
  const [isFixing, setIsFixing] = useState<boolean>(false);
  const [fixedCode, setFixedCode] = useState<string>('');
  
  // Get the Plandex AI context
  const { isAvailable, isLoading, fixBugs } = usePlandexAI();

  // Fix bugs handler
  const handleFixBugs = async () => {
    if (!buggyCode.trim() || !errorMessage.trim() || isFixing) return;

    setIsFixing(true);
    try {
      const result = await fixBugs({
        buggyCode,
        errorMessage,
        language
      });

      setFixedCode(result);
    } catch (error) {
      console.error('Error fixing bugs:', error);
    } finally {
      setIsFixing(false);
    }
  };

  // Clear form handler
  const handleClear = () => {
    setBuggyCode('');
    setErrorMessage('');
    setFixedCode('');
  };

  // Use fixed code handler
  const handleUseFixedCode = () => {
    if (onFixedCode && fixedCode) {
      onFixedCode(fixedCode);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Plandex AI Bug Fixer
          </CardTitle>
          <CardDescription>
            Automatically fix bugs in your code using AI
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !isAvailable ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Plandex AI is not available. Please check your API key configuration.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Programming Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Buggy Code</label>
                <Textarea
                  value={buggyCode}
                  onChange={(e) => setBuggyCode(e.target.value)}
                  placeholder="Paste your code with bugs here"
                  className="font-mono text-sm min-h-[200px] resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Error Message</label>
                <Textarea
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  placeholder="Paste the error message or describe the problem"
                  className="min-h-[100px] resize-y"
                />
              </div>

              {fixedCode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium">Fixed Code</label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUseFixedCode}
                      disabled={!fixedCode}
                      className="h-8"
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Use This Code
                    </Button>
                  </div>
                  
                  <CodeHighlighter 
                    code={fixedCode} 
                    language={language} 
                    className="max-h-[300px] overflow-auto"
                  />
                  
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-500 mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Bugs Fixed
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The code has been fixed by Plandex AI. Review the changes before using it.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleClear}
            disabled={isLoading || isFixing || (!buggyCode && !errorMessage && !fixedCode)}
          >
            Clear
          </Button>
          
          <Button 
            onClick={handleFixBugs} 
            disabled={!buggyCode.trim() || !errorMessage.trim() || isFixing || !isAvailable || isLoading}
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing Bugs...
              </>
            ) : (
              <>
                <Bug className="mr-2 h-4 w-4" />
                Fix Bugs
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}