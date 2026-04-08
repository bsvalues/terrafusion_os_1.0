/**
 * Plandex AI Code Explainer
 * 
 * This component provides a UI for explaining code using Plandex AI.
 * It allows users to input code and get a detailed explanation.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, BookOpen } from 'lucide-react';
import { usePlandexAI } from '@/providers/plandex-ai-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CodeHighlighter } from '@/components/development/CodeHighlighter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlandexAICodeExplainerProps {
  initialCode?: string;
  className?: string;
}

export function PlandexAICodeExplainer({ 
  initialCode = '',
  className = ''
}: PlandexAICodeExplainerProps) {
  // State
  const [code, setCode] = useState<string>(initialCode);
  const [language, setLanguage] = useState<string>('typescript');
  const [detailLevel, setDetailLevel] = useState<'basic' | 'detailed' | 'comprehensive'>('detailed');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('code');
  
  // Get the Plandex AI context
  const { isAvailable, isLoading, explainCode } = usePlandexAI();

  // Generate explanation handler
  const handleExplainCode = async () => {
    if (!code.trim() || isExplaining) return;

    setIsExplaining(true);
    try {
      const result = await explainCode({
        code,
        language,
        detailLevel
      });

      setExplanation(result);
      setActiveTab('explanation');
    } catch (error) {
      console.error('Error explaining code:', error);
    } finally {
      setIsExplaining(false);
    }
  };

  // Clear form handler
  const handleClear = () => {
    setCode('');
    setExplanation('');
    setActiveTab('code');
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Plandex AI Code Explainer
          </CardTitle>
          <CardDescription>
            Get a detailed explanation of code to better understand what it does
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
            <>
              <div className="space-y-4 mb-4">
                <div className="flex flex-wrap gap-4">
                  <div className="w-full sm:w-auto">
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
                        <SelectItem value="sql">SQL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <label className="block text-sm font-medium mb-1">Detail Level</label>
                    <Select value={detailLevel} onValueChange={(value: any) => setDetailLevel(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select detail level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="code" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="explanation" className="flex items-center gap-1" disabled={!explanation}>
                    <BookOpen className="h-4 w-4" />
                    Explanation
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="code" className="mt-4">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code here to get an explanation"
                    className="font-mono text-sm min-h-[300px] resize-y"
                  />
                </TabsContent>
                
                <TabsContent value="explanation" className="mt-4">
                  {explanation ? (
                    <div className="bg-card border rounded-md p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {explanation.split('\n').map((line, i) => (
                          <p key={i} className={line.trim() === '' ? 'my-4' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] bg-muted/30 border rounded-md">
                      <p className="text-muted-foreground">
                        Click "Explain Code" to generate an explanation
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleClear}
            disabled={isLoading || isExplaining || (!code && !explanation)}
          >
            Clear
          </Button>
          
          <Button 
            onClick={handleExplainCode} 
            disabled={!code.trim() || isExplaining || !isAvailable || isLoading}
          >
            {isExplaining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Explaining...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Explain Code
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}