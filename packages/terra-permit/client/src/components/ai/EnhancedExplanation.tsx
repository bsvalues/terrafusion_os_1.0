import { useState, useEffect } from 'react';
import { getEnhancedPermitExplanation } from '@/lib/aiApi';
import { EnhancedExplanation as EnhancedExplanationType } from '@/types/ai';
import { Permit } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Code, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedExplanationProps {
  permitId: number;
  className?: string;
}

export function EnhancedExplanation({ permitId, className }: EnhancedExplanationProps) {
  const [explanation, setExplanation] = useState<EnhancedExplanationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExplanation = async () => {
      if (!permitId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getEnhancedPermitExplanation(permitId);
        setExplanation(data);
      } catch (err) {
        setError('Failed to load explanation. The AI service may be unavailable.');
        console.error('Error fetching permit explanation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [permitId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin opacity-70" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>AI-Enhanced Explanation</CardTitle>
        <div className="text-sm text-muted-foreground">
          Detailed analysis of this permit decision with relevant context
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Decision Explanation</h3>
          <div className="prose max-w-none dark:prose-invert text-sm">
            {explanation.explanation.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-2">{paragraph}</p>
            ))}
          </div>
        </div>

        {explanation.codeReferences && explanation.codeReferences.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Code className="mr-2 h-4 w-4" /> Relevant Codes & Regulations
              </h3>
              <ul className="space-y-2 text-sm">
                {explanation.codeReferences.map((reference, index) => (
                  <li key={index} className="bg-secondary/30 p-3 rounded-md">
                    {reference}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {explanation.similarPermits && explanation.similarPermits.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-medium mb-2">Similar Permits</h3>
              <div className="grid gap-2">
                {explanation.similarPermits.map((permit: Permit) => (
                  <div key={permit.id} className="bg-secondary/30 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Parcel: {permit.parcelNumber}</span>
                      <Badge variant={permit.enterPermit ? "default" : "outline"}>
                        {permit.enterPermit ? "Entered" : "Skipped"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{permit.permitDescription}</p>
                    <p className="text-xs">Reason: {permit.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}