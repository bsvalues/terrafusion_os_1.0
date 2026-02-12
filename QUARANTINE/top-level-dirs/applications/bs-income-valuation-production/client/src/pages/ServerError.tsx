import { Button } from "@/components/ui/button";
import { Warning  } from '@mui/icons-material';
import { Link } from "wouter";

type ServerErrorProps = {
  statusCode?: number;
  message?: string;
  actionLink?: string;
  actionText?: string;
};

/**
 * ServerError component for displaying server errors in a user-friendly way
 * Can be used as a standalone page or embedded in other components
 */
export default function ServerError({
  statusCode = 500,
  message = "We're sorry, but there was a problem connecting to the server.",
  actionLink = "/dashboard",
  actionText = "Go to Dashboard"
}: ServerErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-6"><>

        <Warning className="h-10 w-10 text-destructive" />
      </div>
      
      <h1
</>

className="text-3xl font-bold mb-2">Server Error {statusCode && `(${statusCode})`}</h1><>

      <p className="text-muted-foreground mb-8 max-w-md">
        {message}
      </p>
      
      <div
</>

className="space-y-4">
        <Button asChild>
          <Link href={actionLink}>
            {actionText}
          </Link>
        </Button>
        
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
      
      <div className="mt-10 text-sm text-muted-foreground">
        <p>If this problem persists, please contact support.</p>
      </div>
    </div>
  );
}