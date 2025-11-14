import React, { useMemo, useState } from 'react';
import { useTenant } from './hooks/useTenant';
import BentonDemo from './pages/BentonDemo';
import { DefaultRole, Role, RoleLabels } from './roles';
import {
    CohortLab,
    ImmersiveCanvas3D,
    LevyScenarioBoard,
    ModelTuningPanel,
    OpsHealthBoard,
    RatioStudyDesigner,
    ReportComposer
} from './workbenches';

interface NavItem {
  key: string;
  label: string;
  roles: Role[];
  render: () => React.ReactNode;
}

export const AppShell: React.FC = () => {
  const { tenantId, setTenantId, apiBase } = useTenant();
  const [role, setRole] = useState<Role>(DefaultRole);
  const [active, setActive] = useState<string>('immersive');

  const nav = useMemo<NavItem[]>(() => ([
    { key: 'benton', label: 'Benton Demo', roles: ['levy_clerk','dor_analyst','budget_officer','research_phd','admin'], render: () => <BentonDemo /> },
    { key: 'immersive', label: 'Immersive', roles: ['levy_clerk','dor_analyst','budget_officer','research_phd','admin'], render: () => <ImmersiveCanvas3D countyId={tenantId || ''} /> },
    { key: 'cohorts', label: 'Cohorts', roles: ['levy_clerk','dor_analyst','budget_officer','research_phd','admin'], render: () => <CohortLab /> },
    { key: 'ratio', label: 'Ratio Study', roles: ['dor_analyst','admin'], render: () => <RatioStudyDesigner /> },
    { key: 'levy', label: 'Levy', roles: ['levy_clerk','budget_officer','admin'], render: () => <LevyScenarioBoard /> },
    { key: 'tuning', label: 'Model Tuning', roles: ['research_phd','admin'], render: () => <ModelTuningPanel /> },
    { key: 'ops', label: 'Ops', roles: ['admin'], render: () => <OpsHealthBoard /> },
    { key: 'reports', label: 'Reports', roles: ['levy_clerk','dor_analyst','budget_officer','research_phd','admin'], render: () => <ReportComposer /> },
  ]), [tenantId]);

  const visible = nav.filter(n => n.roles.includes(role));
  const activeItem = visible.find(n => n.key === active) ?? visible[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
        <strong>Shock-and-Awe</strong>
        <span style={{ opacity: 0.6 }}>|</span>
        <label>Tenant:</label>
        <input placeholder="countyId" value={tenantId ?? ''} onChange={(e) => setTenantId(e.target.value || undefined)} style={{ padding: '4px 8px' }} />
        <span style={{ opacity: 0.6, marginLeft: 12 }}>API:</span>
        <code>{apiBase}</code>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {Object.entries(RoleLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </header>
      <nav style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
        {visible.map(n => (
          <button key={n.key} onClick={() => setActive(n.key)} style={{ padding: '6px 10px', border: active === n.key ? '2px solid #2563eb' : '1px solid #d1d5db', background: active === n.key ? '#eff6ff' : 'white', borderRadius: 6 }}>
            {n.label}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, minHeight: 0 }}>
        {activeItem?.render()}
      </main>
      <footer style={{ padding: 8, borderTop: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280' }}>
        TerraFusion OS • Government. Transcended.
      </footer>
    </div>
  );
};

export default AppShell;
