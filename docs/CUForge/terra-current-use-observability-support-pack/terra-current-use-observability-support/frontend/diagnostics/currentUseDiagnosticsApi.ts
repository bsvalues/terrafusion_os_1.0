import type { CurrentUseModuleHealth, CurrentUseError } from './currentUseDiagnosticsTypes';

export async function getCurrentUseHealthMock(): Promise<CurrentUseModuleHealth> {
  return {
    moduleId: 'terra-current-use',
    status: 'DEGRADED',
    checkedAt: new Date().toISOString(),
    checks: [
      {
        component: 'rollback-engine',
        status: 'HEALTHY',
        message: 'Rollback engine available.',
        checkedAt: new Date().toISOString(),
      },
      {
        component: 'policy-resolver',
        status: 'HEALTHY',
        message: 'Policy resolver available.',
        checkedAt: new Date().toISOString(),
      },
      {
        component: 'trace-sink',
        status: 'DEGRADED',
        message: 'Trace sink is using in-memory scaffold.',
        checkedAt: new Date().toISOString(),
      },
    ],
  };
}

export async function getCurrentUseRecentErrorsMock(): Promise<CurrentUseError[]> {
  return [
    {
      errorCode: 'CU_ROLLBACK_MISSING_TAX_YEAR_DATA',
      severity: 'warning',
      userMessage: 'One rollback year is missing required values.',
      technicalMessage: 'Missing currentUseValue for taxYear 2023.',
      correlationId: 'corr-001',
      occurredAt: new Date().toISOString(),
    },
  ];
}
