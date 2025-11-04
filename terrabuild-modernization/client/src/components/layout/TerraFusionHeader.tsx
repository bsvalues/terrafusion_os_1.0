import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Bell,
  ChevronDown,
  HelpCircle,
  LogOut,
  Moon,
  PanelLeft,
  Search,
  Shield,
  Sun,
  User,
  Zap,
  Hexagon,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'wouter';

interface TerraFusionHeaderProps {
  isLanding?: boolean;
}

export default function TerraFusionHeader({ isLanding = false }: TerraFusionHeaderProps) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [hasNotifications, setHasNotifications] = React.useState(true);

  const handleLogout = async () => {
    if (logout) {
      try {
        await logout();
        toast({
          description: 'TerraFusion session terminated successfully',
        });
        navigate('/auth');
      } catch (error) {
        console.error('Logout error:', error);
        toast({
          variant: 'destructive',
          title: 'Session termination failed',
          description: 'An error occurred while logging out',
        });
      }
    } else {
      // Fallback for direct redirect if the logout method is not available
      window.location.href = '/api/logout';
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <TooltipProvider>
      <header
        className={cn(
          'relative z-50 w-full border-b backdrop-blur-lg supports-[backdrop-filter]:bg-white/60',
          isLanding 
            ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700' 
            : 'bg-white/95 border-blue-200/20'
        )}
      >
        {/* TerraFusion quantum scan-line effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent -translate-x-full animate-[scan_3s_ease-in-out_infinite]" />
        </div>

        <div className="relative container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {/* TerraFusion Government OS Logo */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Hexagon className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Zap className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        'text-xl font-black',
                        isLanding 
                          ? 'text-white' 
                          : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent'
                      )}
                    >
                      TerraFusion
                    </span>
                    <span
                      className={cn(
                        'text-xs font-semibold tracking-wider',
                        isLanding ? 'text-blue-100/80' : 'text-blue-600/70'
                      )}
                    >
                      GOVERNMENT OS
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile menu button */}
              {!isLanding && (
                <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden">
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Center - Search Bar (desktop only) */}
            {!isLanding && (
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search TerraFusion Government OS..."
                    className="pl-10 bg-white/80 backdrop-blur border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}

            {/* Right Side - Actions and User Menu */}
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dark-mode"
                      checked={isDarkMode}
                      onCheckedChange={toggleDarkMode}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <Label htmlFor="dark-mode" className="sr-only">
                      Toggle dark mode
                    </Label>
                    {isDarkMode ? (
                      <Moon className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Sun className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle government interface mode</p>
                </TooltipContent>
              </Tooltip>

              {/* Notifications */}
              {!isLanding && isAuthenticated && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-4 w-4" />
                      {hasNotifications && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Government notifications</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Help */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/help">
                      <HelpCircle className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>TerraFusion assistance</p>
                </TooltipContent>
              </Tooltip>

              {/* User Authentication */}
              {!isLanding && (
                <>
                  {isAuthenticated ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 h-auto py-2 px-3"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="hidden sm:flex flex-col items-start">
                            <span className="text-sm font-medium">
                              {user?.name || 'Government Agent'}
                            </span>
                            <span className="text-xs text-muted-foreground">TerraFusion User</span>
                          </div>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 bg-white/95 backdrop-blur border-blue-200/20"
                      >
                        <DropdownMenuLabel className="font-semibold">
                          Government Account
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile Settings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings" className="flex items-center">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>System Preferences</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Terminate Session</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/auth">Access Portal</Link>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white hover:opacity-90"
                        asChild
                      >
                        <Link href="/auth">Government Login</Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}