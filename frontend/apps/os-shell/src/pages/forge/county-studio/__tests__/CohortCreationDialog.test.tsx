import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import { CohortCreationDialog } from '../components/CohortCreationDialog';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { cohortApi } from '../countyStudyApi';

vi.mock('../countyStudyApi', () => ({
  cohortApi: {
    create: vi.fn().mockResolvedValue({
      cohortId: 'new-cohort',
      studyId: 'study-1',
      name: 'My Cohort',
      selectionType: 'Visual',
      parcelCount: 150,
      isHybrid: false,
      createdAt: '2026-04-21T00:00:00Z',
    }),
  },
}));

const setupWithPendingSelection = () => {
  act(() => {
    useCountyStudioStore.setState({
      activeStudy: {
        studyId: 'study-1',
        countyId: 'benton',
        taxYear: 2026,
        studyType: 'RatioStudy',
        status: 'Active',
        baselineVersion: null,
        activeSegmentSetId: null,
        createdAt: '2026-04-21T00:00:00Z',
        updatedAt: '2026-04-21T00:00:00Z',
        createdBy: 'user',
        updatedBy: 'user',
      },
      pendingSelection: {
        parcelIds: ['p1', 'p2', 'p3'],
        source: 'lasso',
        parcelCount: 150,
      },
    });
  });
};

describe('CohortCreationDialog', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.setState({ pendingSelection: null, cohorts: [] });
    });
  });

  it('does not render when pendingSelection is null', () => {
    render(<CohortCreationDialog />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when pendingSelection is set', () => {
    setupWithPendingSelection();
    render(<CohortCreationDialog />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/150 parcels/i)).toBeInTheDocument();
  });

  it('requires a cohort name before Create is enabled', () => {
    setupWithPendingSelection();
    render(<CohortCreationDialog />);
    expect(screen.getByRole('button', { name: /create cohort/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/cohort name/i), { target: { value: 'My Cohort' } });
    expect(screen.getByRole('button', { name: /create cohort/i })).not.toBeDisabled();
  });

  it('Cancel clears pendingSelection from store', () => {
    setupWithPendingSelection();
    render(<CohortCreationDialog />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(useCountyStudioStore.getState().pendingSelection).toBeNull();
  });

  it('Create button calls cohortApi.create and adds to store', async () => {
    setupWithPendingSelection();
    render(<CohortCreationDialog />);

    fireEvent.change(screen.getByLabelText(/cohort name/i), { target: { value: 'My Cohort' } });
    fireEvent.click(screen.getByRole('button', { name: /create cohort/i }));

    await waitFor(() => {
      expect(cohortApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Cohort', studyId: 'study-1' })
      );
    });

    await waitFor(() => {
      expect(useCountyStudioStore.getState().cohorts).toHaveLength(1);
      expect(useCountyStudioStore.getState().pendingSelection).toBeNull();
    });
  });

  it('hides manual parcel-list cohort creation until governed parcel-list support exists', () => {
    setupWithPendingSelection();
    render(<CohortCreationDialog />);

    expect(screen.getByRole('option', { name: /visual/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /rule-based/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /hybrid/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /manual parcel list/i })).not.toBeInTheDocument();
  });
});
