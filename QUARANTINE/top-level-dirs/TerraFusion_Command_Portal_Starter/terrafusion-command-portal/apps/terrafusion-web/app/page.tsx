'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { NavigationHeader } from '@/components/auth/NavigationHeader';
import { LiveDashboard } from '@/components/dashboard/LiveDashboard';
import { WebSocketProvider } from '@/lib/websocket/WebSocketProvider';

export default function HomePage() {
  const { state } = useAuth();

  // Show login form if not authenticated
  if (!state.isAuthenticated) {
    return <LoginForm />;
  }

  // Show main application if authenticated
  return (
    <div className="min-h-screen bg-slate-900">
      <NavigationHeader />
      <main>
        <WebSocketProvider>
          <LiveDashboard />
        </WebSocketProvider>
      </main>
    </div>
  );
}
