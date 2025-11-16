import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { askPermitQuestion } from '@/lib/aiApi';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2  } from '@mui/icons-material';

// Schema for the question form
const questionSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(500, 'Question must be less than 500 characters'),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

interface PermitQuestionFormProps {
  permitIds?: number[];
  className?: string;
}

export function PermitQuestionForm({ permitIds, className }: PermitQuestionFormProps) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: '',
    },
  });

  const onSubmit = async (data: QuestionFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await askPermitQuestion(data.question, permitIds);
      setAnswer(response.answer);
      // Don't reset the form to allow follow-up questions
    } catch (err) {
      setError('Failed to get an answer. Please try again later.');
      console.error('Error asking question:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader><>

        <CardTitle>Ask AI about Permits</CardTitle>
        <div
</> className="text-sm text-muted-foreground">
          Ask questions about permits, regulations, or processing guidelines
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormControl><>

                    <Textarea
                      placeholder="What types of permits typically get approved in residential neighborhoods?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage
</> />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking...
                </>
              ) : (
                'Ask Question'
              )}
            </Button>
          </form>
        </Form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {answer && (
          <div className="mt-6 border rounded-lg p-4 bg-secondary/30"><>

            <h3 className="font-semibold mb-2">Answer:</h3>
            <div
</> className="prose max-w-none dark:prose-invert">
              {answer.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-2">{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {permitIds && permitIds.length > 0 
          ? "This question will be answered with specific permit context" 
          : "Asking general questions about permit processing"}
      </CardFooter>
    </Card>
  );
}