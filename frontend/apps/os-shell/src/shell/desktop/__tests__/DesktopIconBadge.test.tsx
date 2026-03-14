/**
 * Desktop Icon Badge & Group Class Tests
 *
 * Verifies that DesktopIcon has the `group` class for hover-triggered
 * wiring badge visibility, and that badge renders correctly.
 *
 * CANONICAL SPEC (Part 1):
 *   Desktop icons have category-specific gradients.
 *   Wiring badge on hover.
 *   `group` class on container enables group-hover badge.
 *
 * @module shell/desktop/__tests__/DesktopIconBadge.test
 */

import { render, screen } from '@testing-library/react';

import { DesktopIcon } from '../DesktopIcon';

// ============================================================================
// Tests
// ============================================================================

describe('DesktopIcon group class and badge', () => {
  it('outer container has group class', () => {
    render(
      <DesktopIcon
        id='test-icon'
        name='Test Module'
        iconName='Activity'
        category='system'
        wiringStatus='WB'
      />
    );
    const icon = screen.getByTestId('desktop-icon-test-icon');
    expect(icon.className).toContain('group');
  });

  it('wiring badge has group-hover:opacity-100 for hover reveal', () => {
    render(
      <DesktopIcon
        id='test-icon'
        name='Test Module'
        iconName='Activity'
        category='assessment'
        wiringStatus='WB'
      />
    );
    const icon = screen.getByTestId('desktop-icon-test-icon');
    const badge = icon.querySelector('[title="Status: WB"]');
    expect(badge).toBeInTheDocument();
    expect(badge?.className).toContain('group-hover:opacity-100');
    expect(badge?.className).toContain('opacity-0');
  });

  it('renders no badge when wiringStatus is undefined', () => {
    render(
      <DesktopIcon
        id='test-no-badge'
        name='No Badge'
        iconName='Activity'
        category='system'
      />
    );
    const icon = screen.getByTestId('desktop-icon-test-no-badge');
    const badge = icon.querySelector('[title^="Status:"]');
    expect(badge).not.toBeInTheDocument();
  });

  it('icon badge has category-specific gradient via inline style', () => {
    render(
      <DesktopIcon
        id='test-gradient'
        name='Assessment'
        iconName='Activity'
        category='assessment'
        wiringStatus='WB'
      />
    );
    const icon = screen.getByTestId('desktop-icon-test-gradient');
    // The 52×52 gradient container
    const gradientDiv = icon.querySelector('div[style*="linear-gradient"]');
    expect(gradientDiv).toBeInTheDocument();
    expect((gradientDiv as HTMLElement).style.background).toContain('linear-gradient');
  });
});
