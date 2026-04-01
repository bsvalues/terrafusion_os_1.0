import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { ExtensionMenuItems } from '@/components/extensions/ExtensionMenuItems';
import { useExtension } from '@/providers/extension-provider';
import { Link, useLocation } from 'wouter';

const TopNavigation = () => {
  const { user } = useAuth();
  const { executeCommand } = useExtension();
  const [location] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExtensionsMenuOpen, setIsExtensionsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isDropdownOpen) setIsDropdownOpen(false);
      if (isExtensionsMenuOpen) setIsExtensionsMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen, isExtensionsMenuOpen]);

  // Navigation menu items
  const menuItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Land Records', path: '/land-records' },
    { label: 'Improvements', path: '/improvements' },
    { label: 'Fields', path: '/fields' },
    { label: 'Imports', path: '/imports' },
    { label: 'Property Stories', path: '/property-stories' },
    { label: 'Data Lineage', path: '/data-lineage' },
    { label: 'Extensions', path: '/extensions' },
    { label: 'Agent System', path: '/agent-system' },
    { label: 'Voice Commands', path: '/voice-command' },
    { label: 'Master Development', path: '/master-development' },
    { label: 'Development Platform', path: '/development' },
  ];
  
  return (
    <header className="bg-[#111] backdrop-blur-md text-white sticky top-0 z-30">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main navigation bar */}
        <div className="flex items-center justify-between h-14">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          
          {/* Logo and brand */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <span className="text-xl font-semibold">BCBS GeoAssessment</span>
              </div>
            </Link>
          </div>

          {/* Main horizontal menu - hidden on mobile */}
          <nav className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div 
                  className={`px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                    location === item.path
                      ? 'text-white bg-primary-600/10'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  } transition-colors duration-150 ease-in-out`}
                >
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchOpen(!searchOpen);
              }}
              className="p-1 text-white/70 hover:text-white focus:outline-none"
            >
              <span className="sr-only">Search</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Extensions button */}
            <div className="relative">
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExtensionsMenuOpen(!isExtensionsMenuOpen);
                }}
                className="p-1 text-white/70 hover:text-white focus:outline-none"
              >
                <span className="sr-only">Extensions</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              </button>
              
              {isExtensionsMenuOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  <div className="py-1">
                    <ExtensionMenuItems onItemClick={() => setIsExtensionsMenuOpen(false)} />
                  </div>
                </div>
              )}
            </div>

            {/* User profile button */}
            <div className="relative ml-3">
              <button 
                type="button" 
                className="flex items-center text-sm rounded-full focus:outline-none" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-medium">
                  {user?.name.charAt(0)}
                </div>
              </button>
              
              {isDropdownOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none text-gray-700"
                >
                  <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-100">Your Profile</a>
                  <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-100">Settings</a>
                  <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-100">Sign out</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      <div className={`${searchOpen ? 'max-h-16 py-2' : 'max-h-0 py-0'} overflow-hidden transition-all duration-300 px-4 border-t border-white/10`}>
        <div className="relative rounded-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/30" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
            </svg>
          </div>
          <input
            type="search"
            className="block w-full pl-10 pr-3 py-2 bg-white/10 border-0 rounded-md focus:ring-0 text-white placeholder-white/50"
            placeholder="Search properties, parcels, owners..."
          />
        </div>
      </div>

      {/* Mobile menu dropdown - animated sliding panel */}
      <div 
        className={`md:hidden fixed inset-x-0 top-14 bg-[#111]/95 backdrop-blur-md transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-y-0 shadow-lg' : '-translate-y-full'
        }`}
      >
        <div className="px-4 pt-4 pb-6 space-y-2 border-t border-white/10">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div 
                className={`flex items-center px-3 py-3 rounded-lg text-base font-medium cursor-pointer ${
                  location === item.path
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
                {location === item.path && (
                  <span className="ml-auto">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
