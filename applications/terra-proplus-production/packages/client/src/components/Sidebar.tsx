import { NavLink } from 'react-router-dom';
import { LayoutDashboard, 
  Rocket, 
  GitBranch, 
  Activity, 
  Settings,
  X
 } from '@mui/icons-material';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Deployments', path: '/deployments', icon: <Rocket size={20} /> },
    { name: 'Pipelines', path: '/pipelines', icon: <GitBranch size={20} /> },
    { name: 'Monitoring', path: '/monitoring', icon: <Activity size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> }
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 shadow-lg transform lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button (mobile only) */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <div className="flex items-center"><>

            <span className="text-white font-bold text-xl">Terrafusion</span>
            <span
</> className="text-gray-300 font-bold ml-1 text-xl">Pro</span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar header - desktop */}
        <div className="hidden lg:flex items-center p-4"><>

          <span className="text-white font-bold text-xl">Terrafusion</span>
          <span
</> className="text-gray-300 font-bold ml-1 text-xl">Pro</span>
        </div>

        {/* Navigation */}
        <nav className="mt-5 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`
              }
              end={item.path === '/'}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Environment selector */}
        <div className="px-3 mt-6"><>

          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Environment
          </label>
          <div
</> className="relative">
            <select
              className="block w-full bg-gray-700 text-white py-2 pl-3 pr-10 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              defaultValue="prod"
            ><>

              <option value="prod">Production</option>
              <option
</> value="staging">Staging</option><>

              <option value="dev">Development</option>
              <option
</> value="testing">Testing</option>
            </select>
          </div>
        </div>

        {/* User info */}
        <div className="absolute bottom-0 w-full border-t border-gray-700">
          <div className="flex items-center px-4 py-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-gray-300">
                AO
              </div>
            </div>
            <div className="ml-3"><>

              <p className="text-sm font-medium text-white">Alex Operator</p>
              <p
</> className="text-xs font-medium text-gray-400">DevOps Lead</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;