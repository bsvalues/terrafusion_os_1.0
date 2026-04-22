import { act } from 'react';
import { useCountyStudioStore } from '../countyStudioStore';

describe('countyStudioStore — activeCohortId', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().setActiveCohort(null);
    });
  });

  it('starts with activeCohortId null', () => {
    expect(useCountyStudioStore.getState().activeCohortId).toBeNull();
  });

  it('setActiveCohort stores the cohort id', () => {
    act(() => {
      useCountyStudioStore.getState().setActiveCohort('cohort-abc');
    });
    expect(useCountyStudioStore.getState().activeCohortId).toBe('cohort-abc');
  });

  it('setActiveCohort(null) clears the id', () => {
    act(() => {
      useCountyStudioStore.getState().setActiveCohort('cohort-abc');
      useCountyStudioStore.getState().setActiveCohort(null);
    });
    expect(useCountyStudioStore.getState().activeCohortId).toBeNull();
  });
});
