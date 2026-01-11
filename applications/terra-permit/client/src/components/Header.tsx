import TerraFusionLogo from '@/components/TerraFusionLogo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Settings, User } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'wouter';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  // In production mode, use normal authentication
  const isDevelopment = false;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth';
  };

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-blue-700 shadow-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <motion.div
            className="flex items-center"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Link href="/" className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
                <TerraFusionLogo className="h-12" />
              </motion.div>
            </Link>
          </motion.div>

          <motion.div
            className="flex items-center gap-4"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {(user || isDevelopment) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <motion.div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md border-2 border-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                      >
                        {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'D'}
                      </motion.div>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 p-2 shadow-lg border border-blue-100"
                >
                  <DropdownMenuLabel className="bg-blue-50 rounded-md mb-1">
                    <div className="flex flex-col space-y-1">
                      <p className="text-base font-bold text-blue-800">
                        {user?.displayName || user?.username || 'Development User'}
                      </p>
                      <p className="text-sm text-blue-600">{user?.email || 'dev@example.com'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    className="cursor-pointer py-2 hover:bg-blue-50 hover:text-blue-700"
                    asChild
                  >
                    <Link href="/settings">
                      <div className="flex items-center">
                        <Settings className="mr-3 h-5 w-5 text-blue-600" />
                        <span className="high-contrast-text">Settings</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer py-2 hover:bg-blue-50 hover:text-blue-700"
                    asChild
                  >
                    <Link href="/profile">
                      <div className="flex items-center">
                        <User className="mr-3 h-5 w-5 text-blue-600" />
                        <span className="high-contrast-text">Profile</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer py-2 hover:bg-red-50 text-red-600 font-medium"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
