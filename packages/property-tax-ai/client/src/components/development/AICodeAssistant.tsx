import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Code, Bug, Wand2, Loader, Lightbulb, Calculator, History, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AICodeAssistantProps {
  projectId: string;
  fileContent?: string;
  filePath?: string;
  language?: string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

const AICodeAssistant: React.FC<AICodeAssistantProps> = ({
  projectId,
  fileContent = '',
  filePath = '',
  language = 'javascript',
  onInsertCode,
  onClose
}) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('generate');
  const [history, setHistory] = useState<Array<{prompt: string, result: string, type: string}>>([]);

  const handleGenerateCode = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/development/ai/generate-code', {
        method: 'POST',
        data: {
          prompt,
          fileContext: fileContent,
        },
      });

      setResult(response.code);
      addToHistory(prompt, response.code, 'generate');
    } catch (error) {
      console.error('Failed to generate code:', error);
      toast({
        title: "Error",
        description: "Failed to generate code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCode = async () => {
    if (!fileContent.trim()) {
      toast({
        title: "Error",
        description: "No code to complete",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/development/ai/complete-code', {
        method: 'POST',
        data: {
          codeSnippet: fileContent,
          language,
        },
      });

      setResult(response.code);
      addToHistory("Complete code", response.code, 'complete');
    } catch (error) {
      console.error('Failed to complete code:', error);
      toast({
        title: "Error",
        description: "Failed to complete code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExplainCode = async () => {
    if (!fileContent.trim()) {
      toast({
        title: "Error",
        description: "No code to explain",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/development/ai/explain-code', {
        method: 'POST',
        data: {
          code: fileContent,
        },
      });

      setResult(response.explanation);
      addToHistory("Explain code", response.explanation, 'explain');
    } catch (error) {
      console.error('Failed to explain code:', error);
      toast({
        title: "Error",
        description: "Failed to explain code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixBugs = async () => {
    if (!fileContent.trim() || !prompt.trim()) {
      toast({
        title: "Error",
        description: "Please provide code and an error message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/development/ai/fix-bugs', {
        method: 'POST',
        data: {
          code: fileContent,
          errorMessage: prompt,
        },
      });

      setResult(response.code);
      addToHistory(prompt, response.code, 'fix');
    } catch (error) {
      console.error('Failed to fix bugs:', error);
      toast({
        title: "Error",
        description: "Failed to fix bugs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImproveCode = async () => {
    if (!fileContent.trim()) {
      toast({
        title: "Error",
        description: "No code to improve",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/development/ai/recommend-improvement', {
        method: 'POST',
        data: {
          code: fileContent,
        },
      });

      setResult(response.recommendations);
      addToHistory("Improve code", response.recommendations, 'improve');
    } catch (error) {
      console.error('Failed to improve code:', error);
      toast({
        title: "Error",
        description: "Failed to recommend improvements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentModel = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a model description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/development/ai/generate-assessment-model', {
        method: 'POST',
        data: {
          requirements: prompt,
        },
      });

      setResult(response.code);
      addToHistory(prompt, response.code, 'model');
    } catch (error) {
      console.error('Failed to generate assessment model:', error);
      toast({
        title: "Error",
        description: "Failed to generate assessment model",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (promptText: string, resultText: string, type: string) => {
    setHistory(prev => [{ prompt: promptText, result: resultText, type }, ...prev.slice(0, 9)]);
  };

  const restoreFromHistory = (item: {prompt: string, result: string, type: string}) => {
    setPrompt(item.prompt);
    setResult(item.result);
  };

  const insertSelectedCode = () => {
    if (result) {
      onInsertCode(result);
      toast({
        title: "Success",
        description: "Code inserted",
      });
    }
  };

  return (
    <div className="h-full flex flex-col border-l">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 text-indigo-500 mr-2" />
          <h3 className="font-medium">AI Code Assistant</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 justify-start">
          <TabsTrigger value="generate" className="flex items-center">
            <Code className="h-4 w-4 mr-1" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex items-center">
            <Wand2 className="h-4 w-4 mr-1" />
            Complete
          </TabsTrigger>
          <TabsTrigger value="explain" className="flex items-center">
            <Lightbulb className="h-4 w-4 mr-1" />
            Explain
          </TabsTrigger>
          <TabsTrigger value="fix" className="flex items-center">
            <Bug className="h-4 w-4 mr-1" />
            Fix
          </TabsTrigger>
          <TabsTrigger value="improve" className="flex items-center">
            <Sparkles className="h-4 w-4 mr-1" />
            Improve
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center">
            <Calculator className="h-4 w-4 mr-1" />
            Assessment
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <History className="h-4 w-4 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden p-4 pt-2">
          <TabsContent value="generate" className="h-full flex flex-col mt-0">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Generate code from a prompt, using the context of your current file.
              </p>
              <Textarea
                placeholder="Describe the code you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end mt-2">
                <Button onClick={handleGenerateCode} disabled={loading} className="flex items-center">
                  {loading ? <Loader className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  Generate Code
                </Button>
              </div>
            </div>

            {result && (
              <div className="flex-1 overflow-auto border rounded-md">
                <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
                  <span className="text-sm font-medium">Generated Code</span>
                  <Button size="sm" onClick={insertSelectedCode} className="h-8">
                    Insert
                  </Button>
                </div>
                <pre className="p-4 text-sm overflow-auto whitespace-pre-wrap">{result}</pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="complete" className="h-full flex flex-col mt-0">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Complete your partial code using AI. This will use your current file as context.
              </p>
              <div className="flex justify-end">
                <Button onClick={handleCompleteCode} disabled={loading} className="flex items-center">
                  {loading ? <Loader className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
                  Complete Code
                </Button>
              </div>
            </div>

            {result && (
              <div className="flex-1 overflow-auto border rounded-md">
                <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
                  <span className="text-sm font-medium">Completed Code</span>
                  <Button size="sm" onClick={insertSelectedCode} className="h-8">
                    Insert
                  </Button>
                </div>
                <pre className="p-4 text-sm overflow-auto whitespace-pre-wrap">{result}</pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="explain" className="h-full flex flex-col mt-0">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Get an explanation of your code in assessment terminology. This will use your current file as context.
              </p>
              <div className="flex justify-end">
                <Button onClick={handleExplainCode} disabled={loading} className="flex items-center">
                  {loading ? <Loader className="h-4 w-4 mr-1 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-1" />}
                  Explain Code
                </Button>
              </div>
            </div>

            {result && (
              <div className="flex-1 overflow-auto border rounded-md p-4">
                <div className="prose prose-sm max-w-none">
                  {result}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fix" className="h-full flex flex-col mt-0">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Fix bugs in your code by providing the error message. This will use your current file as context.
              </p>
              <Textarea
                placeholder="Paste the error message here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end mt-2">
                <Button onClick={handleFixBugs} disabled={loading} className="flex items-center">
                  {loading ? <Loader className="h-4 w-4 mr-1 animate-spin" /> : <Bug className="h-4 w-4 mr-1" />}
                  Fix Bugs
                </Button>
              </div>
            </div>

            {result && (
              <div className="flex-1 overflow-auto border rounded-md">
                <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
                  <span className="text-sm font-medium">Fixed Code</span>
                  <Button size="sm" onClick={insertSelectedCode} className="h-8">
                    Insert
                  </Button>
                </div>
                <pre className="p-4 text-sm overflow-auto whitespace-pre-wrap">{result}</pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="improve" className="h-full flex flex-col mt-0">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Get recommendations for improving your code, specifically for assessment applications.
              </p>
              <div className="flex justify-end">
                <Button onClick={handleImproveCode} disabled={loading} className="flex items-center">
                  {loading ? <Loader className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  Improve Code
                </Button>
              </div>
            </div>

            {result && (
              <div className="flex-1 overflow-auto border rounded-md p-4">
                <div className="prose prose-sm max-w-none">
                  {result}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assessment" className="h-full flex flex-col mt-0">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Generate specialized assessment model code based on your requirements.
              </p>
              <Textarea
                placeholder="Describe the assessment model you need (e.g., 'residential property valuation model using sales comparison approach')..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end mt-2">
                <Button onClick={handleAssessmentModel} disabled={loading} className="flex items-center">
                  {loading ? <Loader className="h-4 w-4 mr-1 animate-spin" /> : <Calculator className="h-4 w-4 mr-1" />}
                  Generate Model
                </Button>
              </div>
            </div>

            {result && (
              <div className="flex-1 overflow-auto border rounded-md">
                <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
                  <span className="text-sm font-medium">Assessment Model Code</span>
                  <Button size="sm" onClick={insertSelectedCode} className="h-8">
                    Insert
                  </Button>
                </div>
                <pre className="p-4 text-sm overflow-auto whitespace-pre-wrap">{result}</pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="h-full mt-0">
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center">
                        {item.type === 'generate' && <Code className="h-4 w-4 mr-1" />}
                        {item.type === 'complete' && <Wand2 className="h-4 w-4 mr-1" />}
                        {item.type === 'explain' && <Lightbulb className="h-4 w-4 mr-1" />}
                        {item.type === 'fix' && <Bug className="h-4 w-4 mr-1" />}
                        {item.type === 'improve' && <Sparkles className="h-4 w-4 mr-1" />}
                        {item.type === 'model' && <Calculator className="h-4 w-4 mr-1" />}
                        {item.prompt.length > 40 ? `${item.prompt.substring(0, 40)}...` : item.prompt}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date().toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-0">
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => restoreFromHistory(item)}>
                          Restore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <History className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-sm">No history yet</p>
                <p className="text-xs text-gray-400">Your AI interactions will appear here</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AICodeAssistant;