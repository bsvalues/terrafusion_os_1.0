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
  Brain,
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
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'wouter';

interface CostForgeHeaderProps {
  isLanding?: boolean;
}

export default function CostForgeHeader({ isLanding = false }: CostForgeHeaderProps) {
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
          description: 'Session terminated successfully',
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
          'relative z-50 w-full border-b bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60',
          isLanding && 'bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa]'
        )}
      >
        {/* Quantum scan-line effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent via-[#00ffee]/20 to-transparent -translate-x-full animate-[scan_3s_ease-in-out_infinite]" />
        </div>

        <div className="relative container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {/* CostForge AI Logo */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#0099ff] via-[#00ffee] to-[#00ffaa] flex items-center justify-center shadow-lg">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#00ffaa] flex items-center justify-center">
                      <Zap className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        'text-xl font-black bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent',
                        isLanding && 'text-white'
                      )}
                    >
                      CostForge AI
                    </span>
                    <span
                      className={cn(
                        'text-xs font-semibold tracking-wider',
                        isLanding ? 'text-white/80' : 'text-[#243E4D]/70'
                      )}
                    >
                      GOVERNMENT. TRANSCENDED.
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
                    placeholder="Search CostForge AI consciousness..."
                    className="pl-10 bg-white/80 backdrop-blur border-[#00ffee]/20 focus:border-[#00ffee] focus:ring-[#00ffee]/20"
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
                      className="data-[state=checked]:bg-[#00ffee]"
                    />
                    <Label htmlFor="dark-mode" className="sr-only">
                      Toggle dark mode
                    </Label>
                    {isDarkMode ? (
                      <Moon className="h-4 w-4 text-[#00ffee]" />
                    ) : (
                      <Sun className="h-4 w-4 text-[#0099ff]" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle dark mode</p>
                </TooltipContent>
              </Tooltip>

              {/* Notifications */}
              {!isLanding && isAuthenticated && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-4 w-4" />
                      {hasNotifications && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-[#00ffaa] rounded-full animate-pulse" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notifications</p>
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
                  <p>Help</p>
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
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0099ff] to-[#00ffee] flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="hidden sm:flex flex-col items-start">
                            <span className="text-sm font-medium">
                              {user?.name || 'Assessor'}
                            </span>
                            <span className="text-xs text-muted-foreground">Government Agent</span>
                          </div>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 bg-white/95 backdrop-blur border-[#00ffee]/20"
                      >
                        <DropdownMenuLabel className="font-semibold">
                          Benton County
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
                            <span>Preferences</span>
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
                        className="bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white hover:opacity-90"
                        asChild
                      >
                        <Link href="/auth">Sign In</Link>
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
