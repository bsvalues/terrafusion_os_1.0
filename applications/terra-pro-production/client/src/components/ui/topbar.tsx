import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Bell, User, LogOut, Settings, HelpCircle, Zap, Activity  } from '@mui/icons-material';
import { cn } from "@/lib/utils";

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications] = useState([
    { id: 1, message: "QC Review completed for 123 Main St", time: "2m ago", unread: true },
    { id: 2, message: "New order assigned: Property valuation", time: "5m ago", unread: true },
    { id: 3, message: "AI Agent completed 5 conversions", time: "10m ago", unread: false },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Search Section */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search properties, orders, or owners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-0 focus:bg-background"
          />
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center space-x-4">
        {/* AI Agent Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted/50 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><>

          <span className="text-sm font-medium text-foreground">AI Active</span>
          <Badge
</> variant="secondary" className="text-xs">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>

        {/* Quick Actions */}
        <Button variant="ghost" size="sm" className="h-9">
          <Zap className="w-4 h-4 mr-2" />
          Quick Start
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80"><>

            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator
</> />
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                <div className="flex w-full justify-between items-start">
                  <p
                    className={cn(
                      "text-sm",
                      notification.unread ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {notification.message}
                  </p>
                  {notification.unread && (<>

                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1" />
                  )}
                </div>
                <span
</> className="text-xs text-muted-foreground mt-1">{notification.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button variant="ghost" size="icon">
          <HelpCircle className="w-5 h-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/avatars/user.png" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1"><>

                <p className="text-sm font-medium leading-none">John Appraiser</p>
                <p
</> className="text-xs leading-none text-muted-foreground">john@terrafusion.ai</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
