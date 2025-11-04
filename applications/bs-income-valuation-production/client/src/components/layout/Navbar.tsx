import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User, X, KeyRound  } from '@mui/icons-material';
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  
  // Development mode indicator - always true in our current dev setup
  const isDevelopmentMode = true;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    return location === path;
  };
  
  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    return user.fullName 
      ? `${user.fullName.split(' ')[0][0]}${user.fullName.split(' ')[1]?.[0] || ''}`
      : user.username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-blue-600 text-white py-4 shadow-md">
      {/* Dev Mode Banner */}
      {isDevelopmentMode && (
        <div className="bg-amber-500 text-xs md:text-sm text-black px-4 py-1 text-center font-medium">
          ⚠️ DEVELOPMENT MODE - Authentication Disabled - All Protected Routes Accessible
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="text-2xl font-bold text-white hover:text-blue-100 transition cursor-pointer">
                Income Valuation SaaS
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <div className={`text-sm font-medium ${isActive('/') ? 'text-white font-bold' : 'text-blue-100 hover:text-white'} transition cursor-pointer`}>
                Home
              </div>
            </Link>
            
            {/* Dev Login Link - only visible in development */}
            <Link href="/dev-login">
              <div className={`text-sm font-medium ${isActive('/dev-login') ? 'text-white font-bold' : 'text-blue-100 hover:text-white'} transition cursor-pointer flex items-center`}>
                <KeyRound className="mr-1 h-3 w-3" />
                <span>Dev</span>
              </div>
            </Link>
            
            {isAuthenticated ? (
                <Link href="/dashboard">
                  <div className={`text-sm font-medium ${isActive('/dashboard') ? 'text-white font-bold' : 'text-blue-100 hover:text-white'} transition cursor-pointer`}>
                    Dashboard
                  </div>
                </Link>
                <Link href="/calculator">
                  <div className={`text-sm font-medium ${isActive('/calculator') ? 'text-white font-bold' : 'text-blue-100 hover:text-white'} transition cursor-pointer`}>
                    Calculator
                  </div>
                </Link>
                <Link href="/pro-forma">
                  <div className={`text-sm font-medium ${isActive('/pro-forma') ? 'text-white font-bold' : 'text-blue-100 hover:text-white'} transition cursor-pointer`}>
                    Pro Forma
                  </div>
                </Link>
                <Link href="/ai-agents">
                  <div className={`text-sm font-medium ${isActive('/ai-agents') ? 'text-white font-bold' : 'text-blue-100 hover:text-white'} transition cursor-pointer`}>
                    AI Insights
                  </div>
                </Link>
                <Link href="/valuations">
                  <div className={`text-sm font-medium ${isActive('/valuations') ? 'text-white font-bold' : 'text-blue-100 hover:text-white'} transition cursor-pointer`}>
                    Valuations
                  </div>
                </Link>
                <Link href="/reports">
                  <div className={`text-sm font-medium ${isActive('/reports') ? 'text-white font-bold' : 'text-blue-100 hover:text-white'} transition cursor-pointer`}>
                    Reports
                  </div>
                </Link>
                <Link href="/valuation/new">
                  <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                    New Valuation
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-1 focus:outline-none">
                      <Avatar className="h-8 w-8 bg-blue-700 text-white border-2 border-white hover:bg-blue-500 transition">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel><>

                      <div className="font-normal text-xs text-muted-foreground">Signed in as</div>
                      <div
</>

className="font-medium">{user?.username}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/dashboard">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Link href="/login">
                  <div className={`text-sm font-medium ${isActive('/login') ? 'text-white font-bold' : 'text-blue-100 hover:text-white'} transition cursor-pointer`}>
                    Login
                  </div>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                    Register
                  </Button>
                </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="text-white p-2"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              <Link href="/">
                <div 
                  className={`px-2 py-1 rounded ${isActive('/') ? 'bg-blue-700 text-white font-bold' : 'text-blue-100 hover:text-white'} cursor-pointer`}
                  onClick={closeMenu}
                >
                  Home
                </div>
              </Link>
              
              {/* Dev Login Link - only visible in development */}
              <Link href="/dev-login">
                <div 
                  className={`px-2 py-1 rounded ${isActive('/dev-login') ? 'bg-blue-700 text-white font-bold' : 'text-blue-100 hover:text-white'} cursor-pointer flex items-center`}
                  onClick={closeMenu}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Developer Login
                </div>
              </Link>
              
              {isAuthenticated ? (
                  <Link href="/dashboard">
                    <div 
                      className={`px-2 py-1 rounded ${isActive('/dashboard') ? 'bg-blue-700 text-white font-bold' : 'text-blue-100 hover:text-white'} cursor-pointer`}
                      onClick={closeMenu}
                    >
                      Dashboard
                    </div>
                  </Link>
                  <Link href="/calculator">
                    <div 
                      className={`px-2 py-1 rounded ${isActive('/calculator') ? 'bg-blue-700 text-white font-bold' : 'text-blue-100 hover:text-white'} cursor-pointer`}
                      onClick={closeMenu}
                    >
                      Calculator
                    </div>
                  </Link>
                  <Link href="/pro-forma">
                    <div 
                      className={`px-2 py-1 rounded ${isActive('/pro-forma') ? 'bg-blue-700 text-white font-bold' : 'text-blue-100 hover:text-white'} cursor-pointer`}
                      onClick={closeMenu}
                    >
                      Pro Forma Calculator
                    </div>
                  </Link>
                  <Link href="/ai-agents">
                    <div 
                      className={`px-2 py-1 rounded ${isActive('/ai-agents') ? 'bg-blue-700 text-white font-bold' : 'text-blue-100 hover:text-white'} cursor-pointer`}
                      onClick={closeMenu}
                    >
                      AI Insights
                    </div>
                  </Link>
                  <Link href="/valuations">
                    <div 
                      className={`px-2 py-1 rounded ${isActive('/valuations') ? 'bg-blue-700 text-white font-bold' : 'text-blue-100 hover:text-white'} cursor-pointer`}
                      onClick={closeMenu}
                    >
                      Valuations
                    </div>
                  </Link>
                  <Link href="/reports">
                    <div 
                      className={`px-2 py-1 rounded ${isActive('/reports') ? 'bg-blue-700 text-white font-bold' : 'text-blue-100 hover:text-white'} cursor-pointer`}
                      onClick={closeMenu}
                    >
                      Reports
                    </div>
                  </Link>
                  <Link href="/valuation/new">
                    <div 
                      className="px-2 py-1 bg-white text-blue-600 hover:bg-blue-50 rounded cursor-pointer font-semibold"
                      onClick={closeMenu}
                    >
                      New Valuation
                    </div>
                  </Link>
                  <div className="pt-2 border-t border-blue-500">
                    <div className="px-2 py-1 text-sm flex items-center text-white">
                      <User className="mr-2 h-4 w-4" />
                      <span>Signed in as <span className="font-semibold text-white">{user?.username}</span></span>
                    </div>
                    <button 
                      className="mt-2 px-2 py-1 w-full text-left text-white bg-red-500 hover:bg-red-600 rounded flex items-center"
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </div>
              ) : (
                  <Link href="/login">
                    <div 
                      className={`px-2 py-1 rounded ${isActive('/login') ? 'bg-blue-700 text-white font-bold' : 'text-blue-100 hover:text-white'} cursor-pointer`}
                      onClick={closeMenu}
                    >
                      Login
                    </div>
                  </Link>
                  <Link href="/register">
                    <div 
                      className="px-2 py-1 bg-white text-blue-600 hover:bg-blue-50 rounded cursor-pointer font-semibold"
                      onClick={closeMenu}
                    >
                      Register
                    </div>
                  </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
