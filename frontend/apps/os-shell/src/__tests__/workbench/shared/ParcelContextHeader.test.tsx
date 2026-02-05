/**
 * ParcelContextHeader.test.tsx
 *
 * Phase 6.1: Tests for shared ParcelContextHeader component
 *
 * Contract:
 * - Displays suite icon + title
 * - Displays parcel ID with code styling
 * - Displays optional subtitle
 * - Consistent layout across all tabs
 */

import { render, screen } from '@testing-library/react';
import { ParcelContextHeader } from '../../../components/workbench/ParcelContextHeader';

describe('ParcelContextHeader', () => {
  describe('Basic Rendering', () => {
    it('displays suite icon', () => {
      render(<ParcelContextHeader icon='📁' title='TerraDossier' parcelId='12345-001' />);

      expect(screen.getByText('📁')).toBeInTheDocument();
    });

    it('displays title', () => {
      render(<ParcelContextHeader icon='🔥' title='TerraForge' parcelId='12345-001' />);

      expect(screen.getByText('TerraForge')).toBeInTheDocument();
    });

    it('displays parcel ID with code styling', () => {
      render(<ParcelContextHeader icon='🗺️' title='TerraAtlas' parcelId='12345-001' />);

      const parcelCode = screen.getByText('12345-001');
      expect(parcelCode).toBeInTheDocument();
      expect(parcelCode.tagName).toBe('CODE');
    });
  });

  describe('Subtitle', () => {
    it('displays subtitle when provided', () => {
      render(
        <ParcelContextHeader
          icon='📁'
          title='TerraDossier'
          parcelId='12345-001'
          subtitle='Document management for parcel'
        />
      );

      expect(screen.getByText(/document management/i)).toBeInTheDocument();
    });

    it('generates default subtitle with parcel reference', () => {
      render(<ParcelContextHeader icon='📁' title='TerraDossier' parcelId='12345-001' />);

      // Default should reference the parcel
      expect(screen.getByText(/12345-001/)).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('has expected test id for targeting', () => {
      render(<ParcelContextHeader icon='🏛️' title='TerraDais' parcelId='12345-001' />);

      expect(screen.getByTestId('parcel-context-header')).toBeInTheDocument();
    });

    it('renders as semantic header element', () => {
      render(<ParcelContextHeader icon='🏛️' title='TerraDais' parcelId='12345-001' />);

      // Title should be a heading
      expect(screen.getByRole('heading', { name: 'TerraDais' })).toBeInTheDocument();
    });
  });

  describe('Actions Slot', () => {
    it('renders actions when provided', () => {
      render(
        <ParcelContextHeader
          icon='📁'
          title='TerraDossier'
          parcelId='12345-001'
          actions={<button>Custom Action</button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
    });
  });
});
