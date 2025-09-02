import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Warning, CheckCircle, XCircle, Info, Zap  } from '@mui/icons-material';

/**
 * Error Handling Demo Page
 * 
 * Demonstrates the various error handling components and utilities
 * available in the application.
 */
export default function ErrorHandlingPage() {
  const [counter, setCounter] = useState(0);

  // Intentionally throw an error to demonstrate error boundary
  const causeError = () => {
    throw new Error('This is a simulated error to demonstrate the error boundary');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Error Handling Demonstration</h1>
      
      {/* Toast Notifications Demo */}
      <Card className="mb-8">
        <CardHeader><>

          <CardTitle>Toast Notifications</CardTitle>
          <CardDescription
</>>
            Display various types of notifications to the user
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => 
              toast({
                title: 'Information',
                description: 'This is an informational message.',
                variant: 'default'
              })
            }
            variant="outline"
            className="flex gap-2"
          ><>

            <Info className="h-4 w-4" />
            Info Toast
          </Button>
          
          <Button
</>
            onClick={() => 
              toast({
                title: 'Success!',
                description: 'Operation completed successfully.',
                variant: 'success'
              })
            }
            variant="outline"
            className="flex gap-2"
          ><>

            <CheckCircle className="h-4 w-4" />
            Success Toast
          </Button>
          
          <Button
</>
            onClick={() => 
              toast({
                title: 'Warning: Warning',
                description: 'This action might be problematic.',
                variant: 'destructive'
              })
            }
            variant="outline"
            className="flex gap-2"
          ><>

            <Warning className="h-4 w-4" />
            Warning Toast
          </Button>
          
          <Button
</>
            onClick={() => 
              toast({
                title: 'Error',
                description: 'An error occurred during the operation.',
                variant: 'destructive'
              })
            }
            variant="outline"
            className="flex gap-2"
          ><>

            <XCircle className="h-4 w-4" />
            Error Toast
          </Button>
          
          <Button
</>
            onClick={() => 
              toast({
                title: 'Custom Toast',
                description: 'This is a custom toast with an action.',
                variant: 'default',
                action: (
                  <Button size="sm" variant="outline" onClick={() => alert('Custom action')}>
                    Action
                  </Button>
                )
              })
            }
            variant="outline"
            className="flex gap-2"
          >
            <Zap className="h-4 w-4" />
            Custom Toast
          </Button>
        </CardContent>
      </Card>
      
      {/* Error Boundary Demo */}
      <Card className="mb-8">
        <CardHeader><>

          <CardTitle>Error Boundary</CardTitle>
          <CardDescription
</>>
            Demonstrates how the application handles uncaught exceptions
          </CardDescription>
        </CardHeader>
        <CardContent><>

          <p className="mb-4">
            Clicking the button below will intentionally trigger an error to demonstrate
            how error boundaries catch and handle errors gracefully.
          </p>
          <Button
</> 
            variant="destructive"
            onClick={causeError}
          >
            <Warning className="h-4 w-4 mr-2" />
            Trigger Error
          </Button>
        </CardContent>
      </Card>
      
      {/* State Error Handling Demo */}
      <Card>
        <CardHeader><>

          <CardTitle>State Error Handling</CardTitle>
          <CardDescription
</>>
            Demonstrates handling errors in state updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Current counter value: <strong>{counter}</strong>
          </p>
          <div className="flex gap-3"><>

            <Button
              variant="outline"
              onClick={() => {
                try {
                  setCounter((prev) => prev + 1);
                  toast({
                    title: 'Counter Incremented',
                    description: `New value: ${counter + 1}`,
                    variant: 'success'
                  });
                } catch (err) {
                  toast({
                    title: 'State Update Failed',
                    description: 'Failed to increment counter.',
                    variant: 'destructive'
                  });
                }
              }}
            >
              Increment
            </Button>
            
            <Button
</>
              variant="outline"
              onClick={() => {
                if (counter <= 0) {
                  toast({
                    title: 'Warning: Operation Blocked',
                    description: 'Counter cannot go below zero.',
                    variant: 'destructive'
                  });
                  return;
                }
                try {
                  setCounter((prev) => prev - 1);
                  toast({
                    title: 'Counter Decremented',
                    description: `New value: ${counter - 1}`,
                    variant: 'default'
                  });
                } catch (err) {
                  toast({
                    title: 'State Update Failed',
                    description: 'Failed to decrement counter.',
                    variant: 'destructive'
                  });
                }
              }}
            >
              Decrement
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                try {
                  setCounter(0);
                  toast({
                    title: 'Counter Reset',
                    description: 'Counter has been reset to zero.',
                    variant: 'success'
                  });
                } catch (err) {
                  toast({
                    title: 'Reset Failed',
                    description: 'Failed to reset counter.',
                    variant: 'destructive'
                  });
                }
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}