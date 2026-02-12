import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MinimalComponent from './MinimalComponent';

describe('Minimal Component - Isolation Test', () => {
  it('renders without any SSR conflicts', () => {
    render(<MinimalComponent />);
    expect(screen.getByText('TerraFusion Test')).toBeInTheDocument();
  });
});
