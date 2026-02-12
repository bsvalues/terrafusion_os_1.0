import { Link, useLocation } from 'react-router-dom';
import { Home, Building, FileText, BarChart4, Settings, Clipboard, MapPin  } from '@mui/icons-material';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', name: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { path: '/properties', name: 'Properties', icon: <Building className="w-5 h-5" /> },
    { path: '/appraisals', name: 'Appraisals', icon: <Clipboard className="w-5 h-5" /> },
    { path: '/comparables', name: 'Comparables', icon: <MapPin className="w-5 h-5" /> },
    { path: '/reports', name: 'Reports', icon: <FileText className="w-5 h-5" /> },
    { path: '/market-data', name: 'Market Data', icon: <BarChart4 className="w-5 h-5" /> },
    { path: '/settings', name: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className={`fixed top-0 left-0 z-20 h-full pt-16 transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'}`}>
      <div className="h-full overflow-y-auto bg-white border-r border-gray-200 py-5 px-3">
        <ul className="space-y-2">
          {menuItems.map((item /* , index */) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`flex items-center p-2 text-base font-medium rounded-lg ${
                  location.pathname === item.path 
                    ? 'bg-primary text-white' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className={`ml-3 ${!isOpen && 'lg:hidden'}`}>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}