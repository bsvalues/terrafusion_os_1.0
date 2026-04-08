import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

/**
 * Simple test component to isolate the issue
 */
const CodeAssistantPanel: React.FC = () => {
  return (
    <div className="w-full">
      <Card>
        <CardContent>
          <h1>Property Assessment System</h1>
          <p>This is a simplified test component</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeAssistantPanel;