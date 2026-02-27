import React, { useMemo, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/*  TerraFusion Documentation Hub                                      */
/* ------------------------------------------------------------------ */

interface DocSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  articles: { title: string; summary: string; route: string }[];
}

const SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    description: 'Setup, quickstart guides, and first-run walkthroughs.',
    articles: [
      { title: 'TerraFusion OS Overview', summary: 'Architecture, three-tier model, and county sovereignty.', route: '/docs#overview' },
      { title: 'Assessor Quickstart', summary: 'First login, parcel search, and workbench navigation.', route: '/docs#quickstart' },
      { title: 'County Onboarding', summary: 'Steps for new county deployment and data migration.', route: '/docs#onboarding' },
    ],
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: '⚙️',
    description: 'REST endpoints, Pilot API, and tool invocation protocol.',
    articles: [
      { title: 'Pilot API', summary: 'Tool invocation, correlationId tracing, and error handling.', route: '/docs/api#pilot' },
      { title: 'System API', summary: 'Health checks, stats, logs, and administrative endpoints.', route: '/docs/api#system' },
      { title: 'PACS Integration', summary: 'Harris PACS 9.0 sync protocol and data mapping.', route: '/docs/api#pacs' },
      { title: 'Authentication', summary: 'JWT tokens, dev-preview mode, and SSO configuration.', route: '/docs/api#auth' },
    ],
  },
  {
    id: 'suites',
    title: 'Suite Guides',
    icon: '📚',
    description: 'Deep-dive guides for each constitutional suite.',
    articles: [
      { title: 'TerraForge', summary: 'Cost approach, comps, income, appeals, and reconciliation.', route: '/docs/tutorials#forge' },
      { title: 'TerraAtlas', summary: 'GIS layers, parcel lens, layer works, and spatial queries.', route: '/docs/tutorials#atlas' },
      { title: 'TerraDais', summary: 'Levy management, PILT, certifications, and BOE calendar.', route: '/docs/tutorials#dais' },
      { title: 'TerraDossier', summary: 'Document management, evidence chain, and defense packets.', route: '/docs/tutorials#dossier' },
      { title: 'TerraGPT', summary: 'AI studio, custom GPTs, RAG datasets, and analytics.', route: '/docs/tutorials#gpt' },
    ],
  },
  {
    id: 'governance',
    title: 'Governance & Compliance',
    icon: '🏛️',
    description: 'FISMA-HIGH compliance, audit trails, and security policies.',
    articles: [
      { title: 'FISMA Compliance', summary: 'NIST 800-53 controls, continuous monitoring, and POA&Ms.', route: '/docs/videos#fisma' },
      { title: 'Audit Trail', summary: 'CorrelationId tracing, TerraTrace, and event retention.', route: '/docs/videos#audit' },
      { title: 'Data Sovereignty', summary: 'County data isolation, multi-tenant boundaries, and RBAC.', route: '/docs/videos#sovereignty' },
    ],
  },
];

function DocSidebar({ sections, activeSection, onSelect }: {
  sections: DocSection[];
  activeSection: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className='space-y-1' role='navigation' aria-label='Documentation sections'>
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            activeSection === s.id
              ? 'bg-white/10 text-white font-medium'
              : 'text-white/60 hover:bg-white/5 hover:text-white/80'
          }`}
        >
          <span className='mr-2'>{s.icon}</span>
          {s.title}
        </button>
      ))}
    </nav>
  );
}

function DocContent({ section }: { section: DocSection }) {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
          <span className='text-3xl'>{section.icon}</span>
          {section.title}
        </h2>
        <p className='text-white/60 mt-1'>{section.description}</p>
      </div>

      <div className='grid gap-4'>
        {section.articles.map((article) => (
          <div
            key={article.title}
            className='bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors'
          >
            <h3 className='text-white font-semibold'>{article.title}</h3>
            <p className='text-white/50 text-sm mt-1'>{article.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentationHub() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(() => {
    const hash = location.pathname.replace('/docs', '').replace('/', '') || 'getting-started';
    const match = SECTIONS.find(s => s.id === hash || location.pathname.includes(hash));
    return match?.id ?? SECTIONS[0].id;
  });

  const section = useMemo(() => SECTIONS.find(s => s.id === activeSection) ?? SECTIONS[0], [activeSection]);

  return (
    <div className='min-h-screen p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <header className='mb-8'>
          <h1 className='text-3xl font-bold text-white'>TerraFusion Documentation</h1>
          <p className='text-white/50 mt-1'>Guides, API reference, and governance documentation for TerraFusion OS.</p>
        </header>

        {/* Layout: sidebar + content */}
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Sidebar */}
          <div className='lg:col-span-1'>
            <div className='bg-white/5 border border-white/10 rounded-xl p-4 sticky top-20'>
              <DocSidebar sections={SECTIONS} activeSection={activeSection} onSelect={setActiveSection} />
            </div>
          </div>

          {/* Content */}
          <div className='lg:col-span-3'>
            <DocContent section={section} />
          </div>
        </div>
      </div>
    </div>
  );
}

const DocumentationRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path='/docs' element={<DocumentationHub />} />
      <Route path='/docs/api' element={<DocumentationHub />} />
      <Route path='/docs/tutorials' element={<DocumentationHub />} />
      <Route path='/docs/videos' element={<DocumentationHub />} />
    </Routes>
  );
};
export default DocumentationRoutes;
