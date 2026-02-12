import { useState } from 'react';
import { Bell, Menu, Search, User, Settings  } from '@mui/icons-material';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            ><>

              <Menu size={20} />
            </button>
            <div
</> className="ml-4 lg:ml-0 flex items-center"><>

              <span className="text-blue-600 font-bold text-xl">Terrafusion</span>
              <span
</> className="text-gray-600 font-bold ml-1 text-xl">Pro</span>
            </div>
          </div>

          <div className="hidden md:block flex-1 mx-10">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                <Search size={18} className="text-gray-400" />
              </div>
              <input
</>
                type="text"
                placeholder="Search deployments, pipelines..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-2 px-4 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <div className="py-2 px-4 border-b border-gray-100 hover:bg-gray-50"><>

                      <p className="text-sm font-medium text-gray-900">Deployment completed</p>
                      <p
</> className="text-xs text-gray-500">API Gateway v1.2.3 deployed to production</p>
                      <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                    </div>
                    <div className="py-2 px-4 border-b border-gray-100 hover:bg-gray-50"><>

                      <p className="text-sm font-medium text-gray-900">Pipeline failed</p>
                      <p
</> className="text-xs text-gray-500">Payment Processor CI/CD pipeline failed</p>
                      <p className="text-xs text-gray-400 mt-1">25 minutes ago</p>
                    </div>
                    <div className="py-2 px-4 border-b border-gray-100 hover:bg-gray-50"><>

                      <p className="text-sm font-medium text-gray-900">Critical alert</p>
                      <p
</> className="text-xs text-gray-500">High CPU usage on API Gateway server</p>
                      <p className="text-xs text-gray-400 mt-1">35 minutes ago</p>
                    </div>
                  </div>
                  <div className="py-2 px-4 text-center">
                    <a href="#" className="text-xs text-blue-600 hover:text-blue-800">View all notifications</a>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button className="ml-2 p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Settings size={20} />
            </button>

            {/* User menu */}
            <div className="relative ml-3">
              <button
                onClick={toggleUserMenu}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-700">
                  <User size={18} />
                </div>
              </button>

              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1"><>

                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
                    <a
</> href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;