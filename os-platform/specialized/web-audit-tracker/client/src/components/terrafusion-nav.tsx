import {useLocation, Link} from "wouter";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Home, 
  FileText, 
  BarChart3, 
  Settings, 
  Map,
  Zap,
  User,
  Users,
  History,
  ListCheck,
  Route,
  GitBranch,
  Building,
  Cpu,
  Menu,
  X,
  Eye,
  Target} from '@mui/icons-material';
import {useState} from "react";
import {NotificationCenter} from "./notification-center";
import {AccessibilitySettings} from "./accessibility-settings";

interface NavItem {name: string;
  href: string;
  icon: any;
  description?: string;}

const navigation: NavItem[] = [
  {name: "Dashboard", href: "/", icon: Home, description: "Main overview"},
  {name: "Terrafusion Enterprise", href: "/terrafusion", icon: Building, description: "Enterprise platform"},
  {name: "Quantum Processing", href: "/quantum", icon: Cpu, description: "AI & Quantum capabilities"},
  {name: "Assessor Promised Land", href: "/assessor-promised-land", icon: Target, description: "Revolutionary assessor solutions"},
  {name: "GIS Properties", href: "/gis-dashboard", icon: Map, description: "Property mapping"},
  {name: "AI Insights", href: "/ai-insights", icon: Zap, description: "AI predictions & intelligence"},
  {name: "Collaboration", href: "/collaboration", icon: Users, description: "Team collaboration"},
  {name: "Accessibility", href: "/accessibility", icon: Eye, description: "Accessibility features & compliance"},
  {name: "Workflow Manager", href: "/workflow", icon: GitBranch, description: "Process management"},
  {name: "Project Roadmap", href: "/roadmap", icon: Route, description: "Development progress"},
  {name: "Analytics", href: "/analytics", icon: BarChart3, description: "Data analysis"},
  {name: "Audit Queue", href: "/audit-queue", icon: ListCheck, description: "Pending audits"},
];

const managementLinks: NavItem[] = [
  {name: "Brand Showcase", href: "/brand", icon: Building, description: "Brand guidelines"},
  {name: "Account Settings", href: "/account", icon: User, description: "User management"},
  {name: "System Settings", href: "/settings", icon: Settings, description: "Configuration"},
  {name: "Audit History", href: "/audit-history", icon: History, description: "Completed audits"},
];

export default function TerraFusionNav() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const isActive = (path: string) =>location === path;
  
  const toggleNav = () => setIsOpen(!isOpen);

  return (

      {/* Mobile/Desktop Toggle Button and Notifications */}<div className="fixed top-6 left-6 z-50 flex items-center gap-3"><Button 
          onClick={toggleNav}
          className="bg-terrafusion-cyan/20 hover:bg-terrafusion-cyan/30 border border-terrafusion-cyan/50 text-terrafusion-cyan backdrop-blur-sm"
          size="sm"
          data-tour="nav-button"
        >{isOpen ?<X className="h-4 w-4" />:<Menu className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Navigation</span></Button><div className="bg-terrafusion-cyan/10 border border-terrafusion-cyan/30 backdrop-blur-sm rounded-md"><><NotificationCenter /></div><div
</>
className="bg-terrafusion-cyan/10 border border-terrafusion-cyan/30 backdrop-blur-sm rounded-md"><AccessibilitySettings /></div></div>{/* Navigation Overlay */}
      {isOpen && (<div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={toggleNav} />)}

      {/* Navigation Panel */}<div className={`
        fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-r border-terrafusion-cyan/20
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>{/* Header */}<div className="px-6 py-6 border-b border-terrafusion-cyan/20"><div className="flex items-center"><div className="h-12 w-12 intelligence-mark flex items-center justify-center mr-4"><div className="text-white font-bold text-xl tracking-wider font-orbitron">TF</div></div><div><><h1 className="text-xl font-bold font-orbitron text-white tracking-wide">Terrafusion</h1><p
</>
className="text-xs text-terrafusion-cyan/80 font-medium">Intelligence That Counties Envy</p></div></div></div>{/* Main Navigation */}<nav className="px-4 py-6 flex-1 overflow-y-auto"><><div className="text-terrafusion-cyan/50 text-xs uppercase font-semibold px-2 py-2 tracking-wider">Main Navigation</div><div
</>className="space-y-1 mt-4">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (<Link key={item.name} href={item.href} onClick={toggleNav}><div className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    hover:bg-terrafusion-cyan/10 hover:text-terrafusion-cyan
                    ${active ? 'bg-terrafusion-cyan/20 text-terrafusion-cyan border border-terrafusion-cyan/30' : 'text-terrafusion-cyan/70'}
                  `}><item.icon className="h-5 w-5 flex-shrink-0" /><div className="flex-1"><div className="font-medium">{item.name}</div>{item.description && (<div className="text-xs text-slate-400 mt-0.5">{item.description}</div>)}</div>{active && (<Badge className="bg-terrafusion-cyan/20 text-terrafusion-cyan border-terrafusion-cyan/30 text-xs">Active</Badge>)}</div></Link>);
            })}</div>{/* Management Section */}<><div className="text-terrafusion-cyan/50 text-xs uppercase font-semibold px-2 py-2 mt-8 tracking-wider">Management</div><div
</>className="space-y-1 mt-4">
            {managementLinks.map((item) => {
              const active = isActive(item.href);
              return (<Link key={item.name} href={item.href} onClick={toggleNav}><div className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    hover:bg-terrafusion-cyan/10 hover:text-terrafusion-cyan
                    ${active ? 'bg-terrafusion-cyan/20 text-terrafusion-cyan border border-terrafusion-cyan/30' : 'text-terrafusion-cyan/70'}
                  `}><item.icon className="h-5 w-5 flex-shrink-0" /><div className="flex-1"><div className="font-medium">{item.name}</div>{item.description && (<div className="text-xs text-slate-400 mt-0.5">{item.description}</div>)}</div></div></Link>);
            })}</div>{/* Status Badge */}<div className="mt-8 px-2"><div className="bg-terrafusion-cyan/10 border border-terrafusion-cyan/20 rounded-lg p-4"><div className="flex items-center gap-2 mb-2"><><div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div><span
</>
className="text-sm font-medium text-terrafusion-cyan">System Status</span></div><div className="text-xs text-slate-300">Quantum Operational • 99.7% Uptime</div></div></div></nav></div>

  );
}