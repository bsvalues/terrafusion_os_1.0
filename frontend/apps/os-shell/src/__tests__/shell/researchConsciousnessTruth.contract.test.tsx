/**
 * Research consciousness truth contract
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ConsciousnessParameterTuningPanel } from '../../components/research/ConsciousnessParameterTuningPanel';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Research consciousness static truth contract', () => {
  it('ConsciousnessParameterTuningPanel removes simulated tuning behavior', () => {
    const src = readSrc('components/research/ConsciousnessParameterTuningPanel.tsx');

    expect(src).not.toContain('Analyze impact (simulated)');
    expect(src).not.toContain('alert(');
    expect(src).toContain('consciousness-parameter-tuning-unavailable');
    expect(src).toContain('Consciousness tuning unavailable');
  });

  it('researchServices returns explicit unavailable responses for consciousness tuning', () => {
    const src = readSrc('api/researchServices.ts');

    expect(src).toContain('unavailableApiResponse');
    expect(src).toContain('no governed /api/consciousness-tuning backend contract is active');
    expect(src).not.toContain("'/api/consciousness-tuning/adjust'");
  });
});

describe('Research consciousness rendered truth behavior', () => {
  it('renders the tuning panel as unavailable', () => {
    render(<ConsciousnessParameterTuningPanel />);

    expect(screen.getByTestId('consciousness-parameter-tuning-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Consciousness tuning unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/No governed consciousness tuning backend is connected/i)).toBeInTheDocument();
    expect(screen.queryByText(/Apply Parameters/i)).not.toBeInTheDocument();
  });
});
