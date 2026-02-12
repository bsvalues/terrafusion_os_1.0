/**
 * TerraFusion Navigation Header
 * Government-grade navigation with authentication controls
 */

'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Bell,
  Globe,
  Activity
} from 'lucide-react';

export function NavigationHeader() {
  const { state, logout, hasRole } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  if (!state.isAuthenticated || !state.user) {
    return null;
  }

  const { user } = state;

  const getClearanceBadgeColor = (level: string) => {
    switch (level) {
      case 'top_secret': return 'bg-red-600 text-white';
      case 'secret': return 'bg-orange-600 text-white';
      case 'confidential': return 'bg-yellow-600 text-black';
      default: return 'bg-green-600 text-white';
    }
  };

  const getRoleIcon = (roles: string[]) => {
    if (roles.includes('admin')) return '👑';
    if (roles.includes('analyst')) return '📊';
    if (roles.includes('operator')) return '⚙️';
    return '👤';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Side - Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white">TerraFusion Command Portal</h1>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-green-400">
              <Activity className="h-3 w-3" />
              <span className="text-xs">OPERATIONAL</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-400">
              <Globe className="h-3 w-3" />
              <span className="text-xs">SECURE</span>
            </div>
          </div>
        </div>

        {/* Right Side - User Controls */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Info and Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-slate-800 flex items-center space-x-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="flex items-center space-x-2">
                <div className="text-lg">{getRoleIcon(user.roles)}</div>
                <div className="text-left">
                  <div className="text-sm font-medium">{user.email}</div>
                  <div className="text-xs text-slate-400">{user.agency}</div>
                </div>
                <ChevronDown className="h-3 w-3" />
              </div>
            </Button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.email}</div>
                      <div className="text-slate-400 text-sm">ID: {user.user_id}</div>
                    </div>
                  </div>

                  {/* User Status */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 text-sm">Clearance:</span>
                      <Badge className={getClearanceBadgeColor(user.clearance_level)}>
                        {user.clearance_level.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 text-sm">Roles:</span>
                      <div className="flex space-x-1">
                        {user.roles.map(role => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {user.mfa_verified && (
                      <div className="flex items-center space-x-2">
                        <Shield className="h-3 w-3 text-green-400" />
                        <span className="text-green-400 text-sm">MFA Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Button>
                  
                  {hasRole('admin') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Button>
                  )}

                  <div className="border-t border-slate-700 my-2" />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>

                {/* Security Footer */}
                <div className="p-3 bg-slate-900 rounded-b-lg border-t border-slate-700">
                  <div className="text-xs text-slate-500 text-center">
                    <div>Session secured with government-grade encryption</div>
                    <div className="flex items-center justify-center space-x-4 mt-1">
                      <span>🔐 JWT Auth</span>
                      <span>⚡ Real-time</span>
                      <span>🛡️ Federal Grade</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}

export default NavigationHeader;