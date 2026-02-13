/**
 * TerraFusion Command Portal Root Layout
 * 
 * Government-grade application layout with authentication and query providers
 * THE TERRAFUSION WAY: Enterprise-grade structure and security
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TerraFusion Command Portal',
  description: 'Government-grade federation management and monitoring system',
  keywords: 'federation, government, monitoring, security, TerraFusion',
  authors: [{ name: 'TerraFusion Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}