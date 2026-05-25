import React, { useEffect, useState } from 'react';
import { getCurrentUseTenantsMock } from '../tenancy/currentUseTenantApi';
import type { CurrentUseCountyTenant } from '../tenancy/currentUseTenantTypes';

export function CurrentUseCountyTenancyPanel() {
  const [tenants, setTenants] = useState<CurrentUseCountyTenant[]>([]);

  useEffect(() => {
    getCurrentUseTenantsMock().then(setTenants);
  }, []);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">County Tenancy & Deployment</h2>
      <p className="mt-2 text-sm text-slate-600">
        Multi-county governance, onboarding status, and enabled slices.
      </p>

      <div className="mt-4 space-y-3">
        {tenants.map((tenant) => (
          <div key={tenant.countyId} className="rounded-xl border p-4">
            <div className="flex flex-col justify-between gap-2 md:flex-row">
              <div>
                <div className="font-semibold">{tenant.countyName}</div>
                <div className="text-sm text-slate-600">
                  {tenant.stateCode} · {tenant.status}
                </div>
              </div>

              <div className="text-right text-sm">
                <div>Policy {tenant.policyVersion}</div>
                <div>{tenant.theme}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
              <Flag label="AI" enabled={tenant.aiAssistEnabled} />
              <Flag label="Atlas" enabled={tenant.atlasEnabled} />
              <Flag label="Dossier" enabled={tenant.dossierEnabled} />
              <Flag label="Dais" enabled={tenant.daisEnabled} />
              <Flag label="Treasurer" enabled={tenant.treasurerEnabled} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Flag({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="rounded-xl border p-2 text-center text-sm">
      <div className="font-medium">{label}</div>
      <div className={enabled ? 'text-green-700' : 'text-slate-500'}>
        {enabled ? 'Enabled' : 'Disabled'}
      </div>
    </div>
  );
}
