import { useCallback } from 'react';

const UNAVAILABLE_MESSAGE =
  'TerraLevy notebook and compute integrations are not wired to governed runtime services.';

export const useJupyterLab = (_userId: string, _department: string) => {
  const reject = useCallback(async () => null, []);

  return {
    status: 'unavailable' as const,
    error: UNAVAILABLE_MESSAGE,
    isLoading: false,
    notebooks: [] as never[],
    kernels: [] as never[],
    quantumResources: [] as never[],
    openNotebook: reject,
    createNotebook: reject,
    executeCell: reject,
    refresh: async () => undefined,
  };
};
