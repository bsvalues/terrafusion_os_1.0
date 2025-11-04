import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'wouter';

export default function DevDocs() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Strict protection: only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Attempted to access DevDocs in non-development environment');
      setLocation('/');
      return;
    }
    
    // Add a message to the console for debugging
    console.log('DevDocs component mounted in development mode');

    // Fetch the README.md content
    fetch('/README.md')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load documentation');
        }
        return response.text();
      })
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading documentation:', error);
        setLoading(false);
      });
  }, [setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center"><>

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p
</>

className="mt-4 text-muted-foreground">Loading documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto"><>

      <h1 className="text-3xl font-bold mb-4">📘 IncomeValuationTracker Dev Guide</h1>
      <div
</>

className="prose lg:prose-xl">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}