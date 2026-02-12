import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { ExtensionMenuItems } from '@/components/extensions/ExtensionMenuItems';
import { useExtension } from '@/providers/extension-provider';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

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
    { label: 'GIS Hub', path: '/gis', highlight: true },
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
    { label: 'Database Conversion', path: '/database-conversion' },
  ];

  return (
    <header className="bg-card dark:bg-card/40 backdrop-blur-md border-b border-border/40 text-foreground sticky top-0 z-30 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main navigation bar */}
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-foreground/70 hover:text-foreground focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open main menu"
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

          {/* Logo and brand */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <img src="/assets/terrafusion-logo.svg" alt="Terrafusion" className="h-8 w-auto" />
                <span className="font-semibold text-lg hidden sm:block tf-heading">
                  Terrafusion
                </span>
              </div>
            </Link>
          </div>

          {/* Main horizontal menu - hidden on mobile */}
          <nav className="hidden md:ml-6 md:flex md:items-center md:space-x-2">
            {menuItems.map(item => (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    'tf-nav-item text-sm font-medium',
                    location === item.path && 'active',
                    item.highlight &&
                      !location.startsWith(item.path) &&
                      'bg-primary/10 text-primary'
                  )}
                >
                  {item.label}
                  {item.highlight && !location.startsWith(item.path) && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                      New
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search button */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setSearchOpen(!searchOpen);
              }}
              className="p-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
              aria-label="Search"
            ><>

              <span className="sr-only">Search</span>
              <svg
</>
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Extensions button */}
            <div className="relative">
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setIsExtensionsMenuOpen(!isExtensionsMenuOpen);
                }}
                className="p-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
                aria-label="Extensions"
              ><>

                <span className="sr-only">Extensions</span>
                <svg
</>
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                  />
                </svg>
              </button>

              {isExtensionsMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl tf-card-glass backdrop-blur-xl shadow-lg focus:outline-none z-50">
                  <div className="py-1 tf-font-body">
                    <ExtensionMenuItems onItemClick={() => setIsExtensionsMenuOpen(false)} />
                  </div>
                </div>
              )}
            </div>

            {/* AI assistant button with glow effect */}
            <button
              type="button"
              onClick={() => {
                /* Toggle AI assistant */
              }}
              className="tf-ai-icon tf-glow-effect p-1.5 rounded-full"
              aria-label="AI Assistant"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 12L16 8M12 12L8 8M12 12L16 16M12 12L8 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* User profile button */}
            <div className="relative ml-1">
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:outline-none"
                onClick={e => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              ><>

                <span className="sr-only">Open user menu</span>
                <div
</> className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary-800 border border-primary-400/30 flex items-center justify-center text-primary-foreground font-medium shadow-md">
                  {user?.name.charAt(0)}
                </div>
              </button>

              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl tf-card-glass backdrop-blur-xl shadow-lg focus:outline-none tf-font-body z-50">
                  <div className="py-2 px-3 border-b border-border/20"><>

                    <p className="text-sm font-medium">{user?.name}</p>
                    <p
</> className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="py-1"><>

                    <a
                      href="#"
                      className="block px-4 py-2 text-sm hover:bg-foreground/5 rounded-md mx-2 transition-colors"
                    >
                      Your Profile
                    </a>
                    <a
</>
                      href="#"
                      className="block px-4 py-2 text-sm hover:bg-foreground/5 rounded-md mx-2 transition-colors"
                    >
                      Settings
                    </a>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md mx-2 transition-colors"
                    >
                      Sign out
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      <div
        className={`${searchOpen ? 'max-h-16 py-2' : 'max-h-0 py-0'} overflow-hidden transition-all duration-300 px-4 border-t border-border/20 bg-card/60 backdrop-blur-md`}
      >
        <div className="relative rounded-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>
          <input
            type="search"
            className="block w-full pl-10 pr-3 py-2 bg-background/80 border border-border/50 rounded-lg focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder-muted-foreground"
            placeholder="Search properties, parcels, owners..."
          />
        </div>
      </div>

      {/* Mobile menu dropdown - animated sliding panel */}
      <div
        className={`md:hidden fixed inset-x-0 top-16 bg-card/95 backdrop-blur-md transform transition-transform duration-300 ease-in-out z-40 ${
          mobileMenuOpen ? 'translate-y-0 shadow-lg' : '-translate-y-full'
        }`}
      >
        <div className="px-4 pt-4 pb-6 space-y-1 border-t border-border/20">
          {menuItems.map(item => (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  'flex items-center px-3 py-3 rounded-lg text-base font-medium cursor-pointer tf-font-body',
                  location === item.path ? 'bg-primary/15 text-primary' : 'hover:bg-foreground/5',
                  item.highlight && !location.startsWith(item.path) && 'bg-primary/10 text-primary'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
                {item.highlight && !location.startsWith(item.path) && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                    New
                  </span>
                )}
                {location === item.path && (
                  <span className="ml-auto">
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
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
