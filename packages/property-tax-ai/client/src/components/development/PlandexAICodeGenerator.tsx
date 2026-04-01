/**
 * Plandex AI Code Generator
 * 
 * This component provides a UI for generating code using Plandex AI.
 * It allows users to specify a prompt, programming language, and context.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Code, Wand2 } from 'lucide-react';
import { usePlandexAI } from '@/providers/plandex-ai-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CodeHighlighter } from '@/components/development/CodeHighlighter';

interface PlandexAICodeGeneratorProps {
  onCodeGenerated?: (code: string) => void;
  showGeneratedCode?: boolean;
  className?: string;
}

export function PlandexAICodeGenerator({ 
  onCodeGenerated,
  showGeneratedCode = true,
  className = ''
}: PlandexAICodeGeneratorProps) {
  // State
  const [prompt, setPrompt] = useState<string>('');
  const [language, setLanguage] = useState<string>('typescript');
  const [context, setContext] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  
  // Get the Plandex AI context
  const { isAvailable, isLoading, generateCode } = usePlandexAI();

  // Generate code handler
  const handleGenerateCode = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const code = await generateCode({
        prompt,
        language,
        context: context || undefined
      });

      setGeneratedCode(code);
      
      if (onCodeGenerated) {
        onCodeGenerated(code);
      }
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear form handler
  const handleClear = () => {
    setPrompt('');
    setContext('');
    setGeneratedCode('');
  };

  // Use generated code handler
  const handleUseCode = () => {
    if (onCodeGenerated) {
      onCodeGenerated(generatedCode);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Plandex AI Code Generator
          </CardTitle>
          <CardDescription>
            Describe what you want to generate and get AI-powered code suggestions
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Programming Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
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
                <label className="block text-sm font-medium mb-1">Describe the code you need</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., 'Create a function to calculate property tax based on assessed value and tax rate'"
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Context (Optional)</label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Provide additional context such as existing code, specific requirements, or constraints"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          {showGeneratedCode && generatedCode && (
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Generated Code</label>
              <CodeHighlighter 
                code={generatedCode} 
                language={language} 
                className="max-h-96 overflow-auto"
              />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleClear}
            disabled={isLoading || isGenerating || (!prompt && !context && !generatedCode)}
          >
            Clear
          </Button>
          
          <div className="flex gap-2">
            {generatedCode && (
              <Button 
                onClick={handleUseCode}
                disabled={!generatedCode || isGenerating}
                className="flex-nowrap whitespace-nowrap"
              >
                <Code className="mr-2 h-4 w-4" />
                Use Code
              </Button>
            )}
            
            <Button 
              onClick={handleGenerateCode} 
              disabled={!prompt.trim() || isGenerating || !isAvailable || isLoading}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Code
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}