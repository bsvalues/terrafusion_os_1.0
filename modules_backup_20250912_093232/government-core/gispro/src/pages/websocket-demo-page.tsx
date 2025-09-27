import React from 'react';
import WebSocketDemo from '@/components/collaborative/websocket-demo';
import {useTitle} from '@/hooks/use-title';

export default function WebSocketDemoPage() {
  useTitle('WebSocket Demo | BentonGeoPro');

  return (
    <div className="container mx-auto py-8"><h1 className="text-3xl font-bold mb-6 text-center">WebSocket Collaboration Demo</h1><p className="text-center mb-8 max-w-3xl mx-auto text-muted-foreground">This demo showcases real-time collaboration capabilities using WebSockets. Join a room to
        chat with other users and see how messages are instantly delivered across clients.</p><WebSocketDemo /><div className="mt-10 p-4 bg-muted/30 rounded-lg max-w-3xl mx-auto"><h2 className="text-xl font-semibold mb-3">Technical Details</h2><ul className="list-disc pl-5 space-y-2"><li>The WebSocket server runs on the same server as the API, with a dedicated{' '}<code>/ws</code>path.</li><li>Messages are JSON-encoded and include type, sender information, and payload.</li><li>Room-based collaboration allows multiple separate workspaces.</li><li>The connection includes automatic reconnection on network issues.</li><li>Open multiple browser windows to test the real-time collaboration.</li></ul></div></div>
  );
}
