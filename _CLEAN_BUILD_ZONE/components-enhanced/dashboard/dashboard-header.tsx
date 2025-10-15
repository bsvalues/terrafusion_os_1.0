"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { terraFusionBrand } from "@/lib/brand"
import { Search, Bell, Settings, User, LogOut, Shield, Zap, Activity, ChevronDown  } from '@mui/icons-material'

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications] = useState(3)

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <div><>

                <h1 className="font-heading font-bold text-lg">Terrafusion OS</h1>
                <p
</>
className="text-xs text-muted-foreground">{terraFusionBrand.essence}</p>
              </div>
            </div>

            <Badge variant="secondary" className="bg-tf-success/10 text-tf-success border-tf-success/20 hidden sm:flex">
              <Activity className="w-3 h-3 mr-1" />
              All Systems Operational
            </Badge>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search modules, data, or actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* System Status */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-tf-success">
                <Shield className="w-4 h-4" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1 text-tf-accent">
                <Zap className="w-4 h-4" />
                <span>Fast</span>
              </div>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-tf-error">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/county-administrator.png" />
                    <AvatarFallback>CA</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left"><>

                    <p className="text-sm font-medium">County Admin</p>
                    <p
</>
className="text-xs text-muted-foreground">Madison County</p>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56"><>

                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator
</>
/>
                <DropdownMenuItem><>

                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem
</>
</>><>

                  <Settings className="w-4 h-4 mr-2" />
                  System Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator
</>
/>
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
