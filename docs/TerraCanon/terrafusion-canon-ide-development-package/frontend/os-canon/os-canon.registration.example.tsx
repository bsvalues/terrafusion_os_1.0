import React, { lazy } from 'react';

// Example patch target:
// frontend/apps/os-shell/src/config/moduleComponents.tsx

export const moduleComponentsPatch = {
  'os-canon': lazy(() => import('./modules/os-canon/CanonWorkbench'))
};

// Desktop icon launch rule:
// use activateModule('os-canon'), not navigate('/canon').
// Dock and Top Bar must remain visible.
