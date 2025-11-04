import { TerraFusionQueryProvider } from '@/lib/api/provider';
import { AuthProvider } from '@/lib/auth/AuthContext';
import './globals.css';

export const metadata = {
  title: 'TerraFusion Command Portal',
  description: 'Government-grade infrastructure management portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <TerraFusionQueryProvider>
            {children}
          </TerraFusionQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
