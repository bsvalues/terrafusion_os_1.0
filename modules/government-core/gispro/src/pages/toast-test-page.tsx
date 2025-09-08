import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

/**
 * A dedicated page to test toast notifications without map components
 */
export default function ToastTestPage() {
  // Function to trigger different toast notifications
  const showToast = (type: 'default' | 'success' | 'destructive' | 'warning') => {
    switch (type) {
      case 'success':
        toast({
          title: 'Success',
          description: 'Operation completed successfully!',
          variant: 'success',
        });
        break;
      case 'destructive':
        toast({
          title: 'Error',
          description: 'An error occurred during the operation.',
          variant: 'destructive',
        });
        break;
      case 'warning':
        toast({
          title: 'Warning',
          description: 'This action may have unexpected consequences.',
          variant: 'default',
          className: 'bg-yellow-50 border-yellow-200 text-yellow-600',
        });
        break;
      default:
        toast({
          title: 'Information',
          description: 'This is a default toast notification.',
        });
        break;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Toast Notification Test</CardTitle>
          <CardDescription>
            Click the buttons below to test different toast notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={() => showToast('default')} variant="outline">
                Show Default Toast
              </Button>
              <Button
                onClick={() => showToast('success')} 
                variant="outline" 
                className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
              >
                Show Success Toast
              </Button>
              <Button 
                onClick={() => showToast('destructive')} 
                variant="outline" 
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              >
                Show Error Toast
              </Button>
              <Button
                onClick={() => showToast('warning')} 
                variant="outline" 
                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border-yellow-200"
              >
                Show Warning Toast
              </Button>
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-md">
              <h3 className="text-sm font-medium mb-2">Testing Information</h3>
              <p className="text-sm text-slate-600">
                This page is isolated from map components to test the toast notification system directly.
                Click the buttons above to verify that toast notifications are working correctly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
