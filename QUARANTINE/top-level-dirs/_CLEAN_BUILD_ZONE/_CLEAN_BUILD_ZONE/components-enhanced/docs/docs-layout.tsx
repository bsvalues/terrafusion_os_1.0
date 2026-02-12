"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DocsNavigation } from "./docs-navigation"
import { terraFusionBrand } from "@/lib/brand"
import { Search, Menu, X, BookOpen, ExternalLink  } from '@mui/icons-material'

interface DocsLayoutProps {
  children: React.ReactNode
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-tf-clarity/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center"><>

                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div
</>
</>><>

                  <h1 className="font-heading font-bold text-lg">Terrafusion Docs</h1>
                  <p
</>
className="text-xs text-muted-foreground hidden sm:block">{terraFusionBrand.essence}</p>
                </div>
              </div>

              <Badge
                variant="secondary"
                className="bg-tf-primary/10 text-tf-primary border-tf-primary/20 hidden md:flex"
              >
                v2.1.0
              </Badge>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-tf-primary text-tf-primary hover:bg-tf-primary/10 bg-transparent hidden sm:flex"
              ><>

                <ExternalLink className="w-4 h-4 mr-2" />
                Live Demo
              </Button>
              <Button
</>
size="sm" className="bg-tf-primary hover:bg-tf-primary-dark text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
        >
          <div className="flex flex-col h-full pt-16 lg:pt-0">
            <DocsNavigation />
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-8 max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
