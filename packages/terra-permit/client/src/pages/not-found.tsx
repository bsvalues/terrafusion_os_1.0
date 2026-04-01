import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="rounded-full bg-red-100 p-3 mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">Page not found</h1>
      <p className="mt-4 text-base leading-7 text-gray-600 max-w-lg">
        Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or maybe the URL was mistyped.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            Go to Home
          </Link>
        </Button>
        <Button asChild className="gap-2">
          <a onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;