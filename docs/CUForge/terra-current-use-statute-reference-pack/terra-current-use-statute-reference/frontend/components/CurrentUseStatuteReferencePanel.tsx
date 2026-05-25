
import React, { useEffect, useState } from 'react';
import {
  getCurrentUseRuleProvenanceMock,
  getCurrentUseStatutesMock
} from '../statutes/currentUseStatuteApi';

export function CurrentUseStatuteReferencePanel() {
  const [refs, setRefs] = useState<any[]>([]);
  const [prov, setProv] = useState<any[]>([]);

  useEffect(() => {
    getCurrentUseStatutesMock().then(setRefs);
    getCurrentUseRuleProvenanceMock().then(setProv);
  }, []);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Statute & Rule References</h2>

      <div className="mt-4 space-y-3">
        {refs.map((ref) => (
          <div key={ref.citation} className="rounded-xl border p-4">
            <div className="font-semibold">{ref.citation}</div>
            <div className="text-sm text-slate-600">{ref.topic}</div>
            <p className="mt-2 text-sm">{ref.summary}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold">Rule Provenance</h3>

        <div className="mt-3 space-y-2">
          {prov.map((item) => (
            <div key={item.ruleKey} className="rounded-xl border p-3">
              <div className="font-medium">{item.ruleKey}</div>
              <div className="text-sm text-slate-600">
                {item.citation} · Policy {item.policyVersion}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-dashed p-4">
        <p className="text-sm text-slate-600">
          Reference support only. Final legal interpretation remains with authorized county staff and counsel.
        </p>
      </div>
    </section>
  );
}
