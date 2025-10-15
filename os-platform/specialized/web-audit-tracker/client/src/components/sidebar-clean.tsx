import {useLocation, Link} from "wouter";
import {useAuth} from "@/hooks/use-auth";
import {Home, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  Map,
  Zap,
  User,
  History,
  ListCheck,
  Route,
  GitBranch,
  Building,
  Cpu} from '@mui/icons-material';
import {Button} from "@/components/ui/button";

export default function CleanSidebar() {const [location] = useLocation();
  const { user, logoutMutation} = useAuth();
  
  const handleLogout = () =>{logoutMutation.mutate();};
  
  const isActive = (path: string) => location === path;

  const navigation = [
    {name: "Dashboard", href: "/", icon: Home},
    {name: "Terrafusion Enterprise", href: "/terrafusion", icon: Building},
    {name: "Quantum Processing", href: "/quantum", icon: Cpu},
    {name: "GIS Properties", href: "/gis-dashboard", icon: Map},
    {name: "AI Insights", href: "/ai-recommendations", icon: Zap},
    {name: "Workflow Manager", href: "/workflow", icon: GitBranch},
    {name: "Project Roadmap", href: "/roadmap", icon: Route},
    {name: "Action Demo", href: "/action-demo", icon: FileText},
    {name: "Analytics", href: "/analytics", icon: BarChart3},
    {name: "Audit Queue", href: "/audit-queue", icon: ListCheck},
  ];

  const managementLinks = [
    {name: "Audit History", href: "/audit-history", icon: History},
    {name: "Account", href: "/account-management", icon: User},
    {name: "Settings", href: "/settings", icon: Settings},
  ];
  
  return (<div className="terrafusion-sidebar w-64 flex-shrink-0 hidden md:flex flex-col h-screen bg-gradient-to-b from-[#001529] to-[#002a4a] border-r border-[#00d2ff]/20">{/* Header */}<div className="px-6 py-6 border-b border-[#00d2ff]/20"><div className="flex items-center"><div className="h-12 w-12 intelligence-mark flex items-center justify-center mr-4"><div className="text-white font-bold text-xl tracking-wider">TF</div></div><div><><h1 className="text-xl font-bold font-orbitron text-white tracking-wide">Terrafusion</h1><p
</>
className="text-xs text-[#00d2ff]/80 font-medium">Intelligence That Counties Envy</p></div></div></div>{/* Navigation */}<nav className="px-4 py-6 flex-1 overflow-y-auto"><><div className="text-[#00d2ff]/50 text-xs uppercase font-semibold px-2 py-2 tracking-wider">Main Navigation</div><div
</>className="space-y-1 mt-4">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (<Link key={item.name} href={item.href}><div className={`nav-item flex items-center gap-3 px-4 py-3 text-[#00d2ff]/70 hover:text-[#00d2ff] hover:bg-[#00d2ff]/10 rounded-lg transition-all duration-200 ${active ? 'text-[#00d2ff] bg-[#00d2ff]/20' : ''}`}><item.icon className="h-5 w-5 flex-shrink-0" /><span className="font-medium">{item.name}</span></div></Link>);
          })}</div><><div className="text-[#00e5ff]/50 text-xs uppercase font-semibold px-2 py-2 mt-8 tracking-wider">Management</div><div
</>className="space-y-1 mt-4">
          {managementLinks.map((item) => {
            const active = isActive(item.href);
            return (<Link key={item.name} href={item.href}><div className={`nav-item flex items-center gap-3 px-4 py-3 text-[#00d2ff]/70 hover:text-[#00d2ff] hover:bg-[#00d2ff]/10 rounded-lg transition-all duration-200 ${active ? 'text-[#00d2ff] bg-[#00d2ff]/20' : ''}`}><item.icon className="h-5 w-5 flex-shrink-0" /><span className="font-medium">{item.name}</span></div></Link>);
          })}</div></nav>{/* Footer */}<div className="border-t border-[#00e5ff]/20 p-4"><div className="flex items-center w-full"><div className="flex-shrink-0"><div className="h-10 w-10 bg-gradient-to-br from-[#00e5ff]/20 to-[#00b8d4]/20 border border-[#00e5ff]/30 rounded-full flex items-center justify-center text-[#00e5ff] text-sm font-medium">{user?.username?.charAt(0).toUpperCase() || 'U'}</div></div><div className="ml-3 flex-1"><><p className="text-sm font-medium text-white">{user?.username || 'User'}</p><p
</>
className="text-xs text-[#00e5ff]/70 capitalize">{user?.role || 'member'}</p></div><Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="ml-2 p-2 h-9 w-9 hover:bg-[#00e5ff]/10 text-[#00e5ff]/70 hover:text-[#00e5ff]"
          ><LogOut className="h-4 w-4" /></Button></div></div></div>
  );
}