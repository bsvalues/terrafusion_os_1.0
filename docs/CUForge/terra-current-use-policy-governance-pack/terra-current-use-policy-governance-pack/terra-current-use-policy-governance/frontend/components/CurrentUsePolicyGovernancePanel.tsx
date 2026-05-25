
import React, { useEffect, useState } from 'react';
import { getCurrentUsePolicyPacksMock } from '../policy/currentUsePolicyApi';
import type { CurrentUsePolicyPack } from '../policy/currentUsePolicyTypes';

export function CurrentUsePolicyGovernancePanel({
  countyId,
}: {
  countyId: string;
}) {
  const [packs, setPacks] = useState<CurrentUsePolicyPack[]>([]);

  useEffect(() => {
    getCurrentUsePolicyPacksMock(countyId).then(setPacks);
  }, [countyId]);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Policy Governance</h2>

      <div className="space-y-4">
        {packs.map((pack) => (
          <div key={pack.policyPackId} className="rounded-xl border p-4">
            <div className="flex justify-between gap-4">
              <div>
                <div className="font-semibold">{pack.policyPackName}</div>
                <div className="text-sm text-slate-600">
                  Version {pack.policyVersion} · {pack.status}
                </div>
              </div>

              <div className="text-right text-sm">
                Effective {pack.effectiveStartDate}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {pack.rules.map((rule) => (
                <div key={rule.ruleKey} className="rounded-xl border p-3">
                  <div className="font-medium">{rule.ruleKey}</div>
                  <div className="text-sm text-slate-600">
                    {rule.ruleType} = {rule.value}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-dashed p-4">
          <p className="text-sm text-slate-600">
            Every rollback calculation should reference an immutable policy version.
          </p>
        </div>
      </div>
    </div>
  );
}
