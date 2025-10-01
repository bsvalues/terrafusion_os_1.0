import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Benton County UAT Test Hub',
  description: 'TerraFusion OS User Acceptance Testing Management Platform',
  keywords: 'government, uat, testing, terrafusion, benton county',
  authors: [{ name: 'TerraFusion OS Team' }],
  robots: 'noindex, nofollow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="uat-environment" content="benton-county-uat" />
        <meta name="terrafusion-version" content="1.0.0-uat" />
        <meta name="compliance-level" content="fisma-moderate" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-blue-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold">🏛️ Benton County UAT</h1>
                  <span className="ml-4 px-3 py-1 bg-green-600 text-sm rounded-full">
                    TerraFusion OS v1.0.0-UAT
                  </span>
                </div>
                <div className="text-sm">
                  <span className="bg-yellow-600 px-2 py-1 rounded">FISMA MODERATE</span>
                </div>
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="bg-gray-800 text-white py-4 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p>&copy; 2024 TerraFusion OS - Government Grade UAT Environment</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}