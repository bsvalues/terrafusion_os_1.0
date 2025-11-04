import React from "react";
import { CheckCircle2, ArrowRight, Undo2  } from '@mui/icons-material';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessStateProps {
  title?: string;
  message: string;
  className?: string;
  onContinue?: () => void;
  continueText?: string;
  onUndo?: () => void;
  undoText?: string;
  showActions?: boolean;
}

export function SuccessState({
  title = "Success",
  message,
  className,
  onContinue,
  continueText = "Continue",
  onUndo,
  undoText = "Undo",
  showActions = true,
}: SuccessStateProps) {
  return (
    <Alert
      className={cn(
        "flex flex-col items-start border-green-200 bg-green-50 text-green-800",
        className
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3"><>

          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </div>
        <div
</> className="flex-1"><>

          <AlertTitle className="text-base font-medium text-green-800">{title}</AlertTitle>
          <AlertDescription
</> className="mt-1 text-green-700">{message}</AlertDescription>
        </div>
      </div>

      {showActions && (
        <div className="flex mt-3 ml-8 space-x-3">
          {onUndo && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center border-green-300 hover:bg-green-100 hover:text-green-900"
              onClick={onUndo}
            >
              <Undo2 className="mr-2 h-3.5 w-3.5" />
              {undoText}
            </Button>
          )}

          {onContinue && (
            <Button
              variant="default"
              size="sm"
              className="flex items-center bg-green-600 hover:bg-green-700"
              onClick={onContinue}
            >
              {continueText}
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </Alert>
  );
}
