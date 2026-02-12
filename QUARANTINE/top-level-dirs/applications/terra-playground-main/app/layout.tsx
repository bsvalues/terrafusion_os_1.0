import type { Metadata } from 'next';
import './globals.css';
import Navigation from './components/Navigation';
import Notifications from './components/Notifications';

export const metadata: Metadata = {
  title: 'Terrafusion',
  description: 'The next generation of civil infrastructure management',
  icons: {
    icon: '/assets/terrafusion-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-900 text-white">
        <div className="flex">
          <Navigation />
          <div className="flex-1">
            {children}
          </div>
        </div>
        <Notifications />
      </body>
    </html>
  );
} 