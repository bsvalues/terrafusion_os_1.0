'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';
import {ChevronDown,
  ChevronRight,
  Rocket,
  Settings,
  Shield,
  Code,
  Users,
  Calculator,
  FileText,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Database,
  Globe,
  Zap,
  Brain,
  Building,} from '@mui/icons-material';

const navigationItems = [
  {title: 'Getting Started',
    icon: Rocket,
    items: [
      { title: 'Introduction', href: '/docs'},
      {title: 'Quick Start', href: '/docs/quick-start'},
      {title: 'Installation', href: '/docs/installation'},
      {title: 'Configuration', href: '/docs/configuration'},
    ],
  },
  {title: 'Core Modules',
    icon: Settings,
    items: [
      {
        title: 'CostForge AI',
        href: '/docs/modules/costforge-ai',
        icon: Calculator,
        badge: 'AI-Powered',},
      {title: 'PermitFlow', href: '/docs/modules/permitflow', icon: FileText, badge: 'Workflow'},
      {title: 'GeoIntel', href: '/docs/modules/geointel', icon: MapPin, badge: 'Mapping'},
      {title: 'CitizenConnect',
        href: '/docs/modules/citizen-connect',
        icon: Users,
        badge: 'Portal',},
      {title: 'SecureCore', href: '/docs/modules/secure-core', icon: Shield, badge: 'Security'},
    ],
  },
  {title: 'Advanced Modules',
    icon: Brain,
    items: [
      { title: 'FlashProcess', href: '/docs/modules/flash-process', icon: Zap, badge: 'Speed'},
      {title: 'IntelliBoard',
        href: '/docs/modules/intelli-board',
        icon: Brain,
        badge: 'Analytics',},
      {title: 'AssetTrack',
        href: '/docs/modules/asset-track',
        icon: Building,
        badge: 'Management',},
      {title: 'RevenueMax',
        href: '/docs/modules/revenue-max',
        icon: DollarSign,
        badge: 'Finance',},
      {title: 'TimeSync', href: '/docs/modules/time-sync', icon: Clock, badge: 'Scheduling'},
    ],
  },
  {title: 'Compliance & Data',
    icon: Shield,
    items: [
      {
        title: 'ComplianceCheck',
        href: '/docs/modules/compliance-check',
        icon: CheckCircle,
        badge: 'Compliance',},
      {title: 'TrendScope',
        href: '/docs/modules/trend-scope',
        icon: TrendingUp,
        badge: 'Predictive',},
      {title: 'DataVault', href: '/docs/modules/data-vault', icon: Database, badge: 'Data'},
      {title: 'PublicLink', href: '/docs/modules/public-link', icon: Globe, badge: 'Public'},
    ],
  },
  {title: 'API Reference',
    icon: Code,
    items: [
      { title: 'Authentication', href: '/docs/api/authentication'},
      {title: 'Modules API', href: '/docs/api/modules'},
      {title: 'Data API', href: '/docs/api/data'},
      {title: 'Webhooks', href: '/docs/api/webhooks'},
    ],
  },
  {title: 'Deployment',
    icon: Settings,
    items: [
      { title: 'System Requirements', href: '/docs/deployment/requirements'},
      {title: 'Installation Guide', href: '/docs/deployment/installation'},
      {title: 'Configuration', href: '/docs/deployment/configuration'},
      {title: 'Security Setup', href: '/docs/deployment/security'},
      {title: 'Monitoring', href: '/docs/deployment/monitoring'},
    ],
  },
  {title: 'User Guides',
    icon: Users,
    items: [
      { title: 'County Administrators', href: '/docs/guides/administrators'},
      {title: 'IT Directors', href: '/docs/guides/it-directors'},
      {title: 'Department Heads', href: '/docs/guides/department-heads'},
      {title: 'End Users', href: '/docs/guides/end-users'},
    ],
  },
];

export function DocsNavigation() {const [openSections, setOpenSections] = useState<string[]>(['Getting Started']);

  const toggleSection = (title: string) =>{
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );};

  return (<nav className='flex-1 overflow-y-auto p-4 space-y-2'>{navigationItems.map((section) => {
        const SectionIcon = section.icon;
        const isOpen = openSections.includes(section.title);

        return (<Collapsible
            key={section.title}
            open={isOpen}
            onOpenChange={() => toggleSection(section.title)}
          ><CollapsibleTrigger asChild><Button
                variant='ghost'
                className='w-full justify-start font-medium hover:bg-muted/50'
              ><SectionIcon className='w-4 h-4 mr-2' />{section.title}
                {isOpen ? (<ChevronDown className='w-4 h-4 ml-auto' />) : (<ChevronRight className='w-4 h-4 ml-auto' />)}</Button></CollapsibleTrigger><CollapsibleContent className='space-y-1 ml-6'>{section.items.map((item) => {
                const ItemIcon = 'icon' in item ? item.icon : null;
                return (<Button
                    key={item.href}
                    variant='ghost'
                    size='sm'
                    className='w-full justify-start text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  >{ItemIcon &&<ItemIcon className='w-3 h-3 mr-2' />}
                    {item.title}
                    {'badge' in item && item.badge && (
                      <Badge variant='secondary' className='ml-auto text-xs'>{item.badge}</Badge>)}</Button>);
              })}</CollapsibleContent></Collapsible>);
      })}</nav>
  );
}
