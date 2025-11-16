import { Link } from 'react-router-dom';
import { Menu, Home, Building, FileText, BarChart4, Settings, LogOut  } from '@mui/icons-material';
import { useState } from 'react';

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 fixed z-30 w-full">
      <div className="px-3 py-3 lg:px-5 lg:pl-3 flex justify-between items-center">
        <div className="flex items-center justify-start">
          <button className="lg:hidden mr-2" onClick={toggleSidebar}><>

            <Menu className="w-6 h-6 text-gray-500" />
          </button>
          <Link
</> to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary ml-2 md:ml-0">Terrafusion Professional</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                <span className="font-medium">JD</span>
              </div>
              <span className="ml-2 hidden md:inline-block">John Doe</span>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"><>

                <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Settings
                </Link>
                <button
</> className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}