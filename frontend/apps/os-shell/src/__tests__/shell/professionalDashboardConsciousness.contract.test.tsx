/**
 * Professional dashboard consciousness honesty contract
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import QuantumConsciousnessManager from '../../components/consciousness/QuantumConsciousnessManager';
import UniversalTranslationInterface from '../../components/consciousness/UniversalTranslationInterface';
import SpeciesDetectionVisualizer from '../../components/consciousness/SpeciesDetectionVisualizer';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Professional dashboard consciousness static honesty contract', () => {
  it('UniversalTranslationInterface removes retired translation calls', () => {
    const src = readSrc('components/consciousness/UniversalTranslationInterface.tsx');
    expect(src).not.toContain('VITE_CONSCIOUSNESS_URL');
    expect(src).not.toContain('/api/consciousness/translate');
    expect(src).toContain('universal-translation-interface-unavailable');
    expect(src).toContain('Translation provider unavailable');
  });

  it('QuantumConsciousnessManager removes synthetic manager-state actions', () => {
    const src = readSrc('components/consciousness/QuantumConsciousnessManager.tsx');
    expect(src).not.toContain('/consciousness/manager-state');
    expect(src).not.toContain('setQuantumCoherence');
    expect(src).toContain('quantum-consciousness-manager-unavailable');
    expect(src).toContain('Parameter tuning unavailable');
  });

  it('SpeciesDetectionVisualizer removes synthetic feed polling', () => {
    const src = readSrc('components/consciousness/SpeciesDetectionVisualizer.tsx');
    expect(src).not.toContain('/consciousness/detect-species');
    expect(src).not.toContain('setInterval(');
    expect(src).toContain('species-detection-visualizer-unavailable');
    expect(src).toContain('Species detection feed unavailable');
  });
});

describe('Professional dashboard consciousness rendered honesty behavior', () => {
  it('renders UniversalTranslationInterface as unavailable', () => {
    render(<UniversalTranslationInterface />);

    expect(screen.getByTestId('universal-translation-interface-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Translation provider unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/No governed consciousness translation provider is connected/i)).toBeInTheDocument();
    expect(screen.queryByText(/Translate/i)).not.toBeInTheDocument();
  });

  it('renders QuantumConsciousnessManager as unavailable', () => {
    render(<QuantumConsciousnessManager />);

    expect(screen.getByTestId('quantum-consciousness-manager-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Parameter tuning unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/No governed consciousness manager-state contract is connected/i)).toBeInTheDocument();
    expect(screen.getByText(/Live tuning actions are blocked/i)).toBeInTheDocument();
  });

  it('renders SpeciesDetectionVisualizer as unavailable', () => {
    render(<SpeciesDetectionVisualizer />);

    expect(screen.getByTestId('species-detection-visualizer-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Species detection feed unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/No governed species-detection feed is connected/i)).toBeInTheDocument();
    expect(screen.queryByText(/Live Feed/i)).not.toBeInTheDocument();
  });
});
