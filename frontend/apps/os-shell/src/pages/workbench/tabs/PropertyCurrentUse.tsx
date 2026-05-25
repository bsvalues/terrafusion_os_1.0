import React from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { CurrentUseAlphaTab } from '../../../modules/terra-current-use/components/CurrentUseAlphaTab';

export default function PropertyCurrentUse() {
  const { parcelId } = useWorkbenchTab();

  return <CurrentUseAlphaTab parcelId={parcelId ?? ''} />;
}
