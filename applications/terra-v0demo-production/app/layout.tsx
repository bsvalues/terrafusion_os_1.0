import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Building, MapPin, Calculator, FileText, Users, BarChart3  } from '@mui/icons-material'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TerraFusionAssessor-1 | County Property Assessment Platform",
  description: "Enterprise property assessment and tax administration platform for county assessor offices",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4 py-3">
              <div className="flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                  <Building className="h-6 w-6 text-blue-600" />
                  <div><>

                    <span className="font-bold text-xl">TerraFusionAssessor-1</span>
                    <div
</> className="text-xs text-gray-600">Benton County, WA</div>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <Link href="/">
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/properties">
                    <Button variant="ghost" size="sm">
                      <Building className="h-4 w-4 mr-2" />
                      Properties
                    </Button>
                  </Link>
                  <Link href="/assessments">
                    <Button variant="ghost" size="sm">
                      <Calculator className="h-4 w-4 mr-2" />
                      Assessments
                    </Button>
                  </Link>
                  <Link href="/appeals">
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Appeals
                    </Button>
                  </Link>
                  <Link href="/mapping">
                    <Button variant="ghost" size="sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      GIS Mapping
                    </Button>
                  </Link>
                  <Link href="/taxpayers">
                    <Button variant="ghost" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Taxpayers
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
