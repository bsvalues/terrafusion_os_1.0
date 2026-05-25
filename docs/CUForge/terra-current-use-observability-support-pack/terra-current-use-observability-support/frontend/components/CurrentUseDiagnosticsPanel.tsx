import React, { useEffect, useState } from 'react';
import {
  getCurrentUseHealthMock,
  getCurrentUseRecentErrorsMock,
} from '../diagnostics/currentUseDiagnosticsApi';
import type {
  CurrentUseError,
  CurrentUseModuleHealth,
} from '../diagnostics/currentUseDiagnosticsTypes';

export function CurrentUseDiagnosticsPanel() {
  const [health, setHealth] = useState<CurrentUseModuleHealth | null>(null);
  const [errors, setErrors] = useState<CurrentUseError[]>([]);

  useEffect(() => {
    getCurrentUseHealthMock().then(setHealth);
    getCurrentUseRecentErrorsMock().then(setErrors);
  }, []);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Current Use Diagnostics</h2>
      <p className="mt-2 text-sm text-slate-600">
        Operational health, recent errors, and support visibility.
      </p>

      {health && (
        <div className="mt-4 rounded-xl border p-4">
          <div className="flex justify-between">
            <span className="font-semibold">{health.moduleId}</span>
            <span>{health.status}</span>
          </div>

          <div className="mt-3 space-y-2">
            {health.checks.map((check) => (
              <div key={check.component} className="rounded-xl border p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{check.component}</span>
                  <span>{check.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{check.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <h3 className="font-semibold">Recent Errors</h3>

        {errors.map((error) => (
          <div key={`${error.errorCode}-${error.occurredAt}`} className="rounded-xl border p-3">
            <div className="font-medium">{error.errorCode}</div>
            <p className="text-sm text-slate-700">{error.userMessage}</p>
            <p className="mt-1 text-xs text-slate-500">{error.technicalMessage}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
