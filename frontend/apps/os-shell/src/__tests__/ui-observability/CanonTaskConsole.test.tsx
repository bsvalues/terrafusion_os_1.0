/**
 * CanonTaskConsole — read-only Canon task authoring shell (os-canon).
 *
 * First slice: a read-only surface that names the governed task lifecycle and
 * the fields a Canon task carries, and is HONEST that in-shell authoring/
 * execution is not enabled yet — the tf canon CLI + gates are the current rail.
 * No fake placeholder values, no execution, no agents, no commands.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { CanonTaskConsole } from '../../canon/CanonTaskConsole';

describe('CanonTaskConsole', () => {
  it('renders the task console landmark', () => {
    render(<CanonTaskConsole />);
    expect(screen.getByTestId('terracanon-task-console')).toBeInTheDocument();
  });

  it('is honest that in-shell execution is not enabled and points to tf canon', () => {
    render(<CanonTaskConsole />);
    const txt = screen.getByTestId('terracanon-task-console').textContent ?? '';
    expect(txt).toMatch(/not enabled/i);
    expect(txt).toMatch(/tf canon/);
  });

  it('shows the governed task lifecycle (real doctrine states)', () => {
    render(<CanonTaskConsole />);
    const txt = screen.getByTestId('terracanon-task-console').textContent ?? '';
    expect(txt).toMatch(/Draft/);
    expect(txt).toMatch(/TraceSealed/);
    expect(txt).toMatch(/Closed/);
  });

  it('names the task fields without inventing values', () => {
    render(<CanonTaskConsole />);
    const txt = screen.getByTestId('terracanon-task-console').textContent ?? '';
    expect(txt).toMatch(/intent/i);
    expect(txt).toMatch(/scope/i);
    expect(txt).toMatch(/gates/i);
    expect(txt).toMatch(/risk/i);
    expect(txt).toMatch(/evidence/i);
  });

  it('is read-only: no execution buttons or inputs', () => {
    const { container } = render(<CanonTaskConsole />);
    expect(container.querySelectorAll('button').length).toBe(0);
    expect(container.querySelectorAll('input, textarea, select').length).toBe(0);
  });
});
