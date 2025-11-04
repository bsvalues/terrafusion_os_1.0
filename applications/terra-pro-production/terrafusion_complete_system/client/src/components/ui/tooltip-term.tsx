import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Info, ChevronDown, BookOpen  } from '@mui/icons-material';
import { useTooltip } from "../../contexts/TooltipContext";

interface TooltipTermProps {
  term: string;
  children: React.ReactNode;
  context?: string;
}

export const TooltipTerm: React.FC<TooltipTermProps> = ({ term, children, context }) => {
  const { getTermExplanation, isLoading, error } = useTooltip();
  const [explanation, setExplanation] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && !explanation) {
      const result = await getTermExplanation(term, context);
      setExplanation(result);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span className="border-b border-dotted border-blue-400 cursor-help text-blue-600">
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-t-md flex items-center">
          <Info className="h-4 w-4 mr-2 text-blue-500" />
          <h3 className="font-medium text-blue-900">{term}</h3>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-blue-500">Loading explanation...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm py-2">Failed to load explanation.</div>
          ) : explanation ? (
            <div>
              <p className="text-sm text-gray-700">{explanation.definition}</p>

              {explanation.contextualExplanation && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto text-blue-500 flex items-center"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    <ChevronDown
                      className={`h-4 w-4 mr-1 transition-transform ${showDetails ? "rotate-180" : ""}`}
                    />
                    <span className="text-xs">{showDetails ? "Hide" : "Show"} details</span>
                  </Button>

                  {showDetails && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <p>{explanation.contextualExplanation}</p>

                      {explanation.examples && explanation.examples.length > 0 && (
                        <div className="mt-2"><>

                          <h4 className="text-xs font-medium text-gray-700 mb-1">Examples:</h4>
                          <ul
</> className="list-disc list-inside space-y-1">
                            {explanation.examples.map((example: string /* , index */: number) => (
                              <li key={index} className="text-xs">
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {explanation.relatedTerms && explanation.relatedTerms.length > 0 && (
                <div className="mt-3">
                  <Separator className="my-2" /><>

                  <h4 className="text-xs font-medium text-gray-700 mb-1">Related Terms:</h4>
                  <div
</> className="flex flex-wrap gap-1">
                    {explanation.relatedTerms.map((relatedTerm: string /* , index */: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {relatedTerm}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No explanation available for this term.</p>
          )}
        </div>

        <div className="bg-gray-50 p-2 rounded-b-md border-t flex justify-end">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(`${term} real estate term definition`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Learn more
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
};
