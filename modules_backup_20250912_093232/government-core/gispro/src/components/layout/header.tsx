import {useState} from 'react';
import {Link, useLocation} from 'wouter';
import {useAuth} from '@/hooks/use-auth';
import {Bell, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  Inbox,
  Home,
  Map,
  FileText,
  Search,
  Layers,
  CheckSquare,
  PenTool} from '@mui/icons-material';
import {DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

interface HeaderProps {className?: string;
  notificationCount?: number;}

export function Header({className, notificationCount = 0}: HeaderProps) {const [location, setLocation] = useLocation();
  const { user, logoutMutation} = useAuth();
  
  // Handle logout click
  const handleLogout = async () =>{try {
      await logoutMutation.mutateAsync();
      setLocation('/auth');} catch (error) {console.error('Logout failed:', error);}
  };
  
  return (<header className={cn('bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between', className)}>{/* Logo and title */}<div className="flex items-center"><Link href="/"><div className="flex items-center space-x-2 cursor-pointer"><><div className="w-10 h-10 flex items-center justify-center rounded-md bg-primary text-white font-bold text-lg">BC</div><div
</></>><><h1 className="text-xl font-bold">Benton County GIS</h1><p
</>
className="text-xs text-gray-500">Assessor's Office</p></div></div></Link>{/* Main Navigation */}<nav className="hidden md:flex ml-8"><ul className="flex space-x-1"><NavItem href="/" icon={<Home size={18} />} label="Dashboard" /><NavItem href="/workflow-dashboard" icon={<CheckSquare size={18} />} label="Workflows" /><NavItem href="/map-viewer" icon={<Map size={18} />} label="Map Viewer" /><NavItem href="/property-search" icon={<Search size={18} />} label="Property Search" /><NavItem href="/geospatial-analysis" icon={<Layers size={18} />} label="Analysis" /><NavItem href="/report" icon={<FileText size={18} />} label="Reports" /><NavItem href="/cartographer-tools" icon={<PenTool size={18} />} label="Cartographer" /></ul></nav></div>{/* User actions */}<div className="flex items-center space-x-3">{/* Notifications */}<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative"><Bell size={20} />{notificationCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{notificationCount > 9 ? '9+' : notificationCount}</span>)}</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-80"><><DropdownMenuLabel>Notifications</DropdownMenuLabel><DropdownMenuSeparator
</>
/><div className="max-h-[300px] overflow-y-auto p-1"><NotificationItem 
                title="New Workflow Assignment" 
                message="You've been assigned to review a new Long Plat application"
                time="10 minutes ago" /><NotificationItem 
                title="Document Ready"
                message="Parcel #1-1234-567-8901-001 review is completed"
                time="2 hours ago" /><><NotificationItem 
                title="System Update"
                message="GIS system will be undergoing maintenance tonight at 11 PM"
                time="Yesterday" /></div><DropdownMenuSeparator
</>
/><div className="py-2 px-3"><Link href="/workflow-dashboard"><Button variant="link" size="sm" className="w-full justify-center">View all workflows</Button></Link></div></DropdownMenuContent></DropdownMenu>{/* User Profile */}<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="flex items-center space-x-1"><><div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-semibold">{user?.username?.charAt(0).toUpperCase() || 'U'}</div><span
</>className="font-medium max-w-[100px] truncate hidden sm:block">
                {user?.username || 'User'}</span><ChevronDown size={16} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><><DropdownMenuLabel>My Account</DropdownMenuLabel><DropdownMenuSeparator
</>
/><DropdownMenuItem className="flex items-center gap-2"><User size={16} /><span>Profile</span></DropdownMenuItem><DropdownMenuItem className="flex items-center gap-2"><Inbox size={16} /><span>Inbox</span></DropdownMenuItem><DropdownMenuItem className="flex items-center gap-2"><Settings size={16} /><span>Settings</span></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem 
              className="flex items-center gap-2 text-red-600" 
              onClick={handleLogout}
            ><LogOut size={16} /><span>Logout</span></DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></header>);
}

// Navigation item component
interface NavItemProps {href: string;
  icon: React.ReactNode;
  label: string;}

function NavItem({href, icon, label}: NavItemProps) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (<li><Link href={href}><div className={cn(
          "px-3 py-2 flex items-center space-x-1 rounded-md text-sm font-medium cursor-pointer",
          isActive 
            ? "bg-primary-50 text-primary-700" 
            : "text-gray-700 hover:bg-gray-100"
        )}>{icon}<span>{label}</span></div></Link></li>);
}

// Notification item component
interface NotificationItemProps {title: string;
  message: string;
  time: string;}

function NotificationItem({title, message, time}: NotificationItemProps) {
  return (<div className="py-2 px-3 hover:bg-gray-50 rounded-md cursor-pointer"><div className="flex justify-between items-start"><><h4 className="text-sm font-medium">{title}</h4><span
</>
className="text-xs text-gray-500">{time}</span></div><p className="text-xs text-gray-600 mt-1">{message}</p></div>
  );
}