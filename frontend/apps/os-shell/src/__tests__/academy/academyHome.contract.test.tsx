/**
 * ======================================================================
 * TERRAFUSION ACADEMY — Home + TeachMeWhyPanel contract tests
 *
 * Guards the governance-safe Academy path:
 *   - AcademyHome renders its landmark and the authored-doctrine disclaimer
 *   - It presents doctrine cards and never claims live operational status
 *   - "Teach me why" opens TeachMeWhyPanel with authored reasoning + a
 *     required source attribution; Escape/close dismisses it
 *   - TeachMeWhyPanel renders only the content it is given (presentational)
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import AcademyHome from '../../pages/AcademyHome';
import { TeachMeWhyPanel } from '../../components/common/TeachMeWhyPanel';

describe('AcademyHome — authored doctrine landmark', () => {
  it('renders the academy-root landmark', () => {
    render(<AcademyHome />);
    expect(screen.getByTestId('academy-root')).toBeInTheDocument();
  });

  it('discloses that content is authored doctrine, not live status', () => {
    render(<AcademyHome />);
    const banner = screen.getByTestId('academy-doctrine-disclaimer');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/authored institutional doctrine/i);
    expect(banner).toHaveTextContent(/not.*live county status/i);
  });

  it('renders doctrine titles without any teach panel open initially', () => {
    render(<AcademyHome />);
    expect(screen.getByText('Ratio tolerance & calibration')).toBeInTheDocument();
    expect(screen.getByText('Roll certification readiness')).toBeInTheDocument();
    expect(screen.queryByTestId('teach-me-why-panel')).not.toBeInTheDocument();
  });

  it('opens TeachMeWhyPanel with authored attribution when a card is taught', () => {
    render(<AcademyHome />);
    const teachButtons = screen.getAllByRole('button', { name: /teach me why/i });
    fireEvent.click(teachButtons[0]);

    const panel = screen.getByTestId('teach-me-why-panel');
    expect(panel).toBeInTheDocument();

    // Honesty: a source attribution is always present and labels it as authored.
    const source = screen.getByTestId('teach-me-why-source');
    expect(source).toHaveTextContent(/authored institutional doctrine/i);
  });

  it('closes the panel when the close control is used', () => {
    render(<AcademyHome />);
    fireEvent.click(screen.getAllByRole('button', { name: /teach me why/i })[0]);
    expect(screen.getByTestId('teach-me-why-panel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByTestId('teach-me-why-panel')).not.toBeInTheDocument();
  });
});

describe('TeachMeWhyPanel — presentational and honest', () => {
  const steps = [
    { title: 'Step one', body: 'First authored reason.' },
    { title: 'Step two', body: 'Second authored reason.' },
  ];

  it('renders nothing when closed', () => {
    const { container } = render(
      <TeachMeWhyPanel
        open={false}
        onClose={() => {}}
        title="Hidden"
        steps={steps}
        sourceNote="Authored doctrine."
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title, every step, and the required source note', () => {
    render(
      <TeachMeWhyPanel
        open
        onClose={() => {}}
        title="Why this matters"
        steps={steps}
        sourceNote="Authored institutional doctrine. No live data."
      />
    );
    expect(screen.getByText('Why this matters')).toBeInTheDocument();
    expect(screen.getByText('Step one')).toBeInTheDocument();
    expect(screen.getByText('Step two')).toBeInTheDocument();
    expect(screen.getByTestId('teach-me-why-source')).toHaveTextContent(
      /authored institutional doctrine/i
    );
  });

  it('invokes onClose on scrim click and Escape', () => {
    const onClose = vi.fn();
    render(
      <TeachMeWhyPanel open onClose={onClose} title="X" steps={steps} sourceNote="Authored." />
    );
    fireEvent.click(screen.getByTestId('teach-me-why-scrim'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
