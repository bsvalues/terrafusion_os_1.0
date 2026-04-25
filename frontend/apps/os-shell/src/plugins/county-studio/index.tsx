// frontend/apps/os-shell/src/plugins/county-studio/index.tsx
// Thin plugin entry — the OS plugin system mounts this component.
// Delegates entirely to the native CountyStudyPage.
import React from 'react';
import { CountyStudyPage } from '../../pages/forge/county-studio/CountyStudyPage';

export default function CountyStudioPlugin() {
  return <CountyStudyPage />;
}
