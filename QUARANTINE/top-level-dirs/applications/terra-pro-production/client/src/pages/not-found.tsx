import { Button } from "../components/ui/button";
import { Link } from "wouter";

// 404 Not Found page
export default function NotFound() {
  return (
    <div className="flex items-center justify-center flex-col h-full p-6">
      <div className="max-w-md text-center space-y-6"><>

        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2
</> className="text-2xl font-semibold">Page Not Found</h2><>

        <p className="text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div
</> className="pt-4">
          <Button asChild>
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
