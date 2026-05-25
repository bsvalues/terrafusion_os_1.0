import React from 'react';
import { CurrentUseCommandCenterComposed } from '../components/CurrentUseCommandCenterComposed';

export const currentUsePropertyWorkbenchTab = {
  id: 'current-use',
  label: 'Current Use',
  suite: 'terraforge',
  moduleId: 'terra-current-use',
  render: ({
    parcelId,
    countyId,
  }: {
    parcelId: string;
    countyId: string;
  }) => (
    <CurrentUseCommandCenterComposed
      parcelId={parcelId}
      countyId={countyId}
    />
  ),
};
