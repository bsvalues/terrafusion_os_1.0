import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { usePacsModules } from '@/hooks/use-pacs-modules';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

// SVG Icons
const Logo = () => (
  <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21V3H10L12 5L14 3H21V21H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="white" fillOpacity="0.3"/>
  </svg>
);

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const LandRecordsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const ImprovementsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const FieldsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const ImportsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const NaturalLanguageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ValuationMethodsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

const ComparableSalesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const RecalculationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const ChatbotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
  </svg>
);

const NoticesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ProtestAppealsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AuditLogsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ComplianceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const PropertyStoriesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

const AgentSystemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const ExtensionsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
  </svg>
);

const DevelopmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

interface SidebarMenuItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

const SidebarMenuItem = ({ href, icon, children, isActive = false }: SidebarMenuItemProps) => {
  const activeClasses = "bg-primary-600 text-white";
  const inactiveClasses = "text-gray-700 hover:bg-gray-100";
  
  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-md group cursor-pointer",
        isActive ? activeClasses : inactiveClasses
      )}>
        {icon}
        {children}
      </div>
    </Link>
  );
};

interface SidebarSectionProps {
  title: string;
  agentType: string;
  children: React.ReactNode;
}

const SidebarSection = ({ title, agentType, children }: SidebarSectionProps) => (
  <div data-agent={agentType}>
    <div className="px-3 py-2 mt-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {title}
    </div>
    {children}
  </div>
);

export const Sidebar = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // In a real app, you'd use these hooks
  // const { modules, isLoading } = usePacsModules();
  // if (isLoading) return <div>Loading...</div>;
  
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
          <div className="flex items-center">
            <Logo />
            <span className="ml-2 text-white font-semibold text-lg">MCP Platform</span>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          <nav className="px-2 py-4 space-y-1">
            {/* Dashboard Link */}
            <SidebarMenuItem 
              href="/" 
              icon={<DashboardIcon />}
              isActive={location === "/"}
            >
              Dashboard
            </SidebarMenuItem>

            {/* Data Management Section */}
            <SidebarSection title="Data Management" agentType="data-management">
              <SidebarMenuItem 
                href="/land-records" 
                icon={<LandRecordsIcon />}
                isActive={location === "/land-records"}
              >
                Land Records
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/improvements" 
                icon={<ImprovementsIcon />}
                isActive={location === "/improvements"}
              >
                Improvements
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/fields" 
                icon={<FieldsIcon />}
                isActive={location === "/fields"}
              >
                Fields
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/imports" 
                icon={<ImportsIcon />}
                isActive={location === "/imports"}
              >
                Imports
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/natural-language" 
                icon={<NaturalLanguageIcon />}
                isActive={location === "/natural-language"}
              >
                Natural Language
              </SidebarMenuItem>

              <SidebarMenuItem 
                href="/property-stories" 
                icon={<PropertyStoriesIcon />}
                isActive={location === "/property-stories"}
              >
                Property Stories
              </SidebarMenuItem>

              <SidebarMenuItem 
                href="/agent-system" 
                icon={<AgentSystemIcon />}
                isActive={location === "/agent-system"}
              >
                MCP Agent System
              </SidebarMenuItem>

              <SidebarMenuItem 
                href="/voice-search" 
                icon={<MicIcon />}
                isActive={location === "/voice-search"}
              >
                Voice Search
              </SidebarMenuItem>
            </SidebarSection>

            {/* Property Valuation Section */}
            <SidebarSection title="Property Valuation" agentType="property-valuation">
              <SidebarMenuItem 
                href="/valuation-methods" 
                icon={<ValuationMethodsIcon />}
                isActive={location === "/valuation-methods"}
              >
                Valuation Methods
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/comparable-sales" 
                icon={<ComparableSalesIcon />}
                isActive={location === "/comparable-sales"}
              >
                Comparable Sales
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/recalculation" 
                icon={<RecalculationIcon />}
                isActive={location === "/recalculation"}
              >
                Recalculation
              </SidebarMenuItem>
            </SidebarSection>

            {/* Citizen Interaction Section */}
            <SidebarSection title="Citizen Interaction" agentType="citizen-interaction">
              <SidebarMenuItem 
                href="/chatbot" 
                icon={<ChatbotIcon />}
                isActive={location === "/chatbot"}
              >
                Chatbot
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/notices" 
                icon={<NoticesIcon />}
                isActive={location === "/notices"}
              >
                Notices
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/protest-appeals" 
                icon={<ProtestAppealsIcon />}
                isActive={location === "/protest-appeals"}
              >
                Protest Appeals
              </SidebarMenuItem>
            </SidebarSection>

            {/* Quality & Compliance Section */}
            <SidebarSection title="Quality & Compliance" agentType="audit-compliance">
              <SidebarMenuItem 
                href="/audit-logs" 
                icon={<AuditLogsIcon />}
                isActive={location === "/audit-logs"}
              >
                Audit Logs
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/compliance" 
                icon={<ComplianceIcon />}
                isActive={location === "/compliance"}
              >
                Compliance
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/settings" 
                icon={<SettingsIcon />}
                isActive={location === "/settings"}
              >
                Settings
              </SidebarMenuItem>
            </SidebarSection>

            {/* Developer Tools Section */}
            <SidebarSection title="Developer Tools" agentType="developer-tools">
              <SidebarMenuItem 
                href="/extensions" 
                icon={<ExtensionsIcon />}
                isActive={location === "/extensions"}
              >
                Extensions
              </SidebarMenuItem>
              
              <SidebarMenuItem 
                href="/development" 
                icon={<DevelopmentIcon />}
                isActive={location === "/development" || location.startsWith("/development/")}
              >
                TaxI_AI Development
              </SidebarMenuItem>
            </SidebarSection>
          </nav>
        </div>
        
        {/* User Profile Section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block cursor-pointer">
            <div className="flex items-center">
              <div>
                <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gray-500 text-white">
                  {user?.name.charAt(0)}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{user?.name}</p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
