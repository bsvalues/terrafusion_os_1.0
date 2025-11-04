import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

// Design system components
import { AppShell } from '@/components/design-system/layout/AppShell';
import { NavMenu } from '@/components/design-system/navigation/NavMenu';
import { AppBar } from '@/components/design-system/navigation/AppBar';
import { Sidebar } from '@/components/design-system/navigation/Sidebar';

// Icons
import { Home,
  Map,
  FileText,
  Building,
  Database,
  FileSpreadsheet,
  BookOpen,
  History,
  PuzzleIcon,
  Mic,
  Code,
  ServerCog,
  BrainCircuit,
  Settings,
  Bell,
  Search,
  HelpCircle,
  User,
 } from '@mui/icons-material';

// Existing service components
import AIAssistantSidebar from '@/components/ai-assistant/AIAssistantSidebar';
import { AgentVoiceCommandButton } from '@/components/agent-voice/AgentVoiceCommandButton';
import { AgentVoiceCommandResults } from '@/components/agent-voice/AgentVoiceCommandResults';
import { VoiceCommandResult, RecordingState } from '@/services/agent-voice-command-service';
import QuickAccessMenu from '@/components/quick-access-menu';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Define the navigation structure
const navigationItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: <Home className="h-5 w-5" />,
  },
  {
    key: 'land-records',
    label: 'Land Records',
    href: '/land-records',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    key: 'improvements',
    label: 'Improvements',
    href: '/improvements',
    icon: <Building className="h-5 w-5" />,
  },
  {
    key: 'fields',
    label: 'Fields',
    href: '/fields',
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    key: 'imports',
    label: 'Imports',
    href: '/imports',
    icon: <Database className="h-5 w-5" />,
  },
];

// Organized navigation with categories
const organizedNavigation = [
  {
    key: 'core',
    label: 'Core Functions',
    icon: <Home className="h-4 w-4" />,
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/',
        icon: <Home className="h-5 w-5" />,
      },
      {
        key: 'land-records',
        label: 'Land Records',
        href: '/land-records',
        icon: <FileText className="h-5 w-5" />,
      },
      {
        key: 'improvements',
        label: 'Improvements',
        href: '/improvements',
        icon: <Building className="h-5 w-5" />,
      },
      {
        key: 'fields',
        label: 'Fields',
        href: '/fields',
        icon: <FileSpreadsheet className="h-5 w-5" />,
      },
      {
        key: 'imports',
        label: 'Imports',
        href: '/imports',
        icon: <Database className="h-5 w-5" />,
      },
    ],
  },
  {
    key: 'assessment',
    label: 'Assessment',
    icon: <BrainCircuit className="h-4 w-4" />,
    items: [
      {
        key: 'property-stories',
        label: 'Property Stories',
        href: '/property-stories',
        icon: <BookOpen className="h-5 w-5" />,
      },
      {
        key: 'data-lineage',
        label: 'Data Lineage',
        href: '/data-lineage',
        icon: <History className="h-5 w-5" />,
      },
      {
        key: 'natural-language',
        label: 'Natural Language',
        href: '/natural-language',
        icon: <FileText className="h-5 w-5" />,
      },
      {
        key: 'ai-assistant',
        label: 'AI Assistant',
        href: '/ai-assistant',
        icon: <BrainCircuit className="h-5 w-5" />,
      },
      {
        key: 'voice-search',
        label: 'Voice Search',
        href: '/voice-search',
        icon: <Mic className="h-5 w-5" />,
      },
    ],
  },
  {
    key: 'geospatial',
    label: 'Geospatial',
    icon: <Map className="h-4 w-4" />,
    items: [
      {
        key: 'gis',
        label: 'GIS Hub',
        href: '/gis',
        icon: <Map className="h-5 w-5" />,
        highlight: true,
      },
      {
        key: 'gis-clustering',
        label: 'Clustering',
        href: '/gis/clustering-demo',
        icon: <Map className="h-5 w-5" />,
      },
      {
        key: 'gis-advanced-clustering',
        label: 'Advanced Clustering',
        href: '/gis/advanced-clustering',
        icon: <Map className="h-5 w-5" />,
      },
      {
        key: 'gis-terrain',
        label: 'Terrain 3D',
        href: '/gis/terrain-3d',
        icon: <Map className="h-5 w-5" />,
      },
    ],
  },
  {
    key: 'extension',
    label: 'Extensions',
    icon: <PuzzleIcon className="h-4 w-4" />,
    items: [
      {
        key: 'extensions',
        label: 'Extensions',
        href: '/extensions',
        icon: <PuzzleIcon className="h-5 w-5" />,
      },
      {
        key: 'agents',
        label: 'Agent System',
        href: '/agent-system',
        icon: <BrainCircuit className="h-5 w-5" />,
      },
      {
        key: 'team-agents',
        label: 'Team Agents',
        href: '/team-agents',
        icon: <BrainCircuit className="h-5 w-5" />,
      },
      {
        key: 'voice-command',
        label: 'Voice Commands',
        href: '/voice-command',
        icon: <Mic className="h-5 w-5" />,
      },
    ],
  },
  {
    key: 'development',
    label: 'Development',
    icon: <Code className="h-4 w-4" />,
    items: [
      {
        key: 'master-development',
        label: 'Master Development',
        href: '/master-development',
        icon: <Code className="h-5 w-5" />,
      },
      {
        key: 'development-platform',
        label: 'Development Platform',
        href: '/development',
        icon: <Code className="h-5 w-5" />,
      },
      {
        key: 'db-conversion',
        label: 'Database Conversion',
        href: '/database-conversion',
        icon: <Database className="h-5 w-5" />,
      },
      {
        key: 'example-dashboard',
        label: 'Example Dashboard',
        href: '/example-dashboard',
        icon: <FileText className="h-5 w-5" />,
      },
      {
        key: 'terrafusion-showcase',
        label: 'UI Showcase',
        href: '/terrafusion-showcase',
        icon: <FileText className="h-5 w-5" />,
      },
    ],
  },
];

const NewAppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.INACTIVE);
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [showCommandResults, setShowCommandResults] = useState(false);

  // Find active navigation item
  const getActiveKey = () => {
    if (location === '/') return 'dashboard';
    const matchingGroup = organizedNavigation.find(group =>
      group.items.some(item => item.href === location)
    );

    if (!matchingGroup) return '';

    const matchingItem = matchingGroup.items.find(item => item.href === location);
    return matchingItem ? matchingItem.key : '';
  };

  const handleVoiceCommandResult = (result: VoiceCommandResult) => {
    setLastResult(result);
    setShowCommandResults(true);
    // Auto-hide results after 5 seconds if successful
    if (result.successful) {
      setTimeout(() => {
        setShowCommandResults(false);
      }, 5000);
    }
  };

  const handleStateChange = (state: RecordingState) => {
    setRecordingState(state);
    // When recording stops, show the results panel
    if (state === RecordingState.INACTIVE && recordingState !== RecordingState.INACTIVE) {
      setShowCommandResults(true);
    }
  };

  // Handle sidebar toggle for mobile
  const toggleMobileSidebar = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Logo component for sidebar
  const logo = (
    <div className="flex items-center gap-2">
      <img src="/assets/terrafusion-logo.svg" alt="Terrafusion" className="h-8 w-auto" />
      <span
        className={`font-semibold text-lg tf-heading transition-opacity duration-200 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}
      >
        Terrafusion
      </span>
    </div>
  );

  // User menu component for top bar
  const userMenu = (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="p-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
        aria-label="Search"
      >
<>
        <Search className="h-5 w-5" />
      </button>

      <button
</>
        type="button"
        className="p-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
        aria-label="Notifications"
      >
<>
        <Bell className="h-5 w-5" />
      </button>

      <button
</>
        type="button"
        className="p-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
        aria-label="Help"
      >
<>
        <HelpCircle className="h-5 w-5" />
      </button>

      <div
</> className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary-800 border border-primary-400/30 flex items-center justify-center text-primary-foreground font-medium shadow-md">
        <User className="h-5 w-5" />
      </div>
    </div>
  );

  return (
    <AppShell
      header={
        <AppBar
          logo={logo}
          showMenuToggle={true}
          onMenuClick={toggleMobileSidebar}
          actions={userMenu}
          variant="default"
          sticky={true}
          elevation="low"
        />
      }
      sidebar={
        <Sidebar
          variant="default"
          collapsible={true}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          border="right"
        >
          <NavMenu
            variant="vertical"
            groups={organizedNavigation}
            activeKey={getActiveKey()}
            itemVariant="default"
            className="px-2"
          />
        </Sidebar>
      }
      collapsible={true}
      defaultCollapsed={sidebarCollapsed}
      className="bg-background"
    >
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 relative p-4 md:p-6">
          {children}

          {/* Floating Voice Command Button */}
          <div className="fixed bottom-6 right-6 z-40">
            <AgentVoiceCommandButton
              onStateChange={handleStateChange}
              onResult={handleVoiceCommandResult}
              agentId="assessment_assistant"
              subject="property_assessment"
              size="large"
              className="shadow-lg"
            />
          </div>

          {/* Voice Command Results Panel */}
          {showCommandResults && lastResult && (
            <div className="fixed bottom-24 right-6 z-40 w-80 animate-in slide-in-from-right-10 duration-300">
              <AgentVoiceCommandResults
                result={lastResult}
                onClose={() => setShowCommandResults(false)}
              />
            </div>
          )}
        </main>
      </div>

      {/* AI Assistant Sidebar */}
      <AIAssistantSidebar />

      {/* Quick Access Menu */}
      <QuickAccessMenu />
    </AppShell>
  );
};

export default NewAppLayout;
