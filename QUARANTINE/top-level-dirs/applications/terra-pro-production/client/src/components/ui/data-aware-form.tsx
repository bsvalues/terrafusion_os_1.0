import React, { useState } from "react";
import { Form as ShadcnForm } from "@/components/ui/form";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { SuccessState } from "@/components/ui/success-state";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";

interface DataAwareFormProps {
  form: UseFormReturn<any, any, undefined>;
  title?: string;
  description?: string;
  onSubmit: (values: any) => Promise<void> | void;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  error?: {
    message: string;
    title?: string;
  } | null;
  success?: {
    message: string;
    title?: string;
  } | null;
  onSuccessContinue?: () => void;
  resetOnSuccess?: boolean;
  hideSubmitOnSuccess?: boolean;
}

export function DataAwareForm({
  form,
  title,
  description,
  onSubmit,
  submitText = "Submit",
  cancelText = "Cancel",
  onCancel,
  children,
  className,
  isLoading: externalLoading,
  error: externalError,
  success: externalSuccess,
  onSuccessContinue,
  resetOnSuccess = true,
  hideSubmitOnSuccess = false,
}: DataAwareFormProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<{ message: string; title?: string } | null>(
    null
  );
  const [internalSuccess, setInternalSuccess] = useState<{
    message: string;
    title?: string;
  } | null>(null);

  // Use external state if provided, otherwise use internal state
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
  const error = externalError !== undefined ? externalError : internalError;
  const success = externalSuccess !== undefined ? externalSuccess : internalSuccess;

  const handleSubmit = async (values: any) => {
    try {
      setInternalLoading(true);
      setInternalError(null);
      setInternalSuccess(null);

      await onSubmit(values);

      // If onSubmit doesn't throw, we consider it a success
      if (externalSuccess === undefined) {
        setInternalSuccess({
          title: "Success",
          message: "Your form has been submitted successfully.",
        });
      }

      if (resetOnSuccess) {
        form.reset();
      }
    } catch (error: any) {
      if (externalError === undefined) {
        setInternalError({
          title: "Error",
          message: error.message || "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      if (externalLoading === undefined) {
        setInternalLoading(false);
      }
    }
  };

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}

      <CardContent>
        {error && (
          <ErrorState
            title={error.title}
            message={error.message}
            className="mb-4"
            onRetry={() => {
              setInternalError(null);
              externalError === undefined && setInternalError(null);
            }}
          />
        )}

        {success && (
          <SuccessState
            title={success.title}
            message={success.message}
            className="mb-4"
            onContinue={onSuccessContinue}
            showActions={!!onSuccessContinue}
          />
        )}

        <LoadingState
          isLoading={isLoading}
          loadingText="Submitting form..."
          variant="inline"
          className="mb-4"
        >
          <ShadcnForm {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              {children}

              <div className="flex justify-end gap-3 mt-6">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    {cancelText}
                  </Button>
                )}

                {(!success || !hideSubmitOnSuccess) && (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Submitting..." : submitText}
                  </Button>
                )}
              </div>
            </form>
          </ShadcnForm>
        </LoadingState>
      </CardContent>
    </Card>
  );
}
