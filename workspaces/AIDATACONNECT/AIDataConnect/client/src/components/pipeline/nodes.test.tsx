import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceNode, TransformNode, FilterNode, JoinNode, OutputNode } from './nodes';

describe('Pipeline Nodes', () => {
  const defaultNodeProps = {
    id: 'test-node',
    selected: false,
    type: 'default',
    zIndex: 1,
    isConnectable: true,
    xPos: 0,
    yPos: 0,
    dragHandle: '.drag-handle'
  };

  describe('SourceNode', () => {
    it('renders with correct label and handles', () => {
      const mockData = {
        label: 'Test Source',
        type: 'source'
      };

      renderWithProviders(<SourceNode data={mockData} {...defaultNodeProps} />);

      expect(screen.getByText('Test Source')).toBeInTheDocument();
      expect(screen.getByText('Data Source')).toBeInTheDocument();
      // Check for the source handle
      const sourceHandle = document.querySelector('[data-handlepos="right"]');
      expect(sourceHandle).toBeInTheDocument();
    });
  });

  describe('TransformNode', () => {
    const mockData = {
      label: 'Test Transform',
      type: 'transform',
      config: {
        transformation: 'return data.map(x => x * 2)'
      }
    };

    it('renders transform node with configuration', () => {
      renderWithProviders(<TransformNode data={mockData} {...defaultNodeProps} />);

      expect(screen.getByText('Test Transform')).toBeInTheDocument();
      expect(screen.getByText('Transform Data')).toBeInTheDocument();
      // Check for both handles
      const handles = document.querySelectorAll('[data-handlepos]');
      expect(handles.length).toBe(2);
    });

    it('opens configuration dialog when button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TransformNode data={mockData} {...defaultNodeProps} />);

      const configButton = screen.getByRole('button', { name: /edit transform/i });
      await user.click(configButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Configure Data Transformation')).toBeInTheDocument();
    });

    it('displays existing transformation code', () => {
      renderWithProviders(<TransformNode data={mockData} {...defaultNodeProps} />);

      expect(screen.getByText('return data.map(x => x * 2)')).toBeInTheDocument();
    });
  });

  describe('FilterNode', () => {
    it('renders with correct label and handles', () => {
      const mockData = {
        label: 'Test Filter',
        type: 'filter'
      };

      renderWithProviders(<FilterNode data={mockData} {...defaultNodeProps} />);

      expect(screen.getByText('Test Filter')).toBeInTheDocument();
      expect(screen.getByText('Filter Data')).toBeInTheDocument();
      // Check for both handles
      const handles = document.querySelectorAll('[data-handlepos]');
      expect(handles.length).toBe(2);
    });
  });

  describe('JoinNode', () => {
    it('renders with correct label and handles', () => {
      const mockData = {
        label: 'Test Join',
        type: 'join'
      };

      renderWithProviders(<JoinNode data={mockData} {...defaultNodeProps} />);

      expect(screen.getByText('Test Join')).toBeInTheDocument();
      expect(screen.getByText('Join Data')).toBeInTheDocument();
      // Check for both handles
      const handles = document.querySelectorAll('[data-handlepos]');
      expect(handles.length).toBe(2);
    });
  });

  describe('OutputNode', () => {
    it('renders with correct label and handle', () => {
      const mockData = {
        label: 'Test Output',
        type: 'output'
      };

      renderWithProviders(<OutputNode data={mockData} {...defaultNodeProps} />);

      expect(screen.getByText('Test Output')).toBeInTheDocument();
      expect(screen.getByText('Output')).toBeInTheDocument();
      // Check for the target handle
      const targetHandle = document.querySelector('[data-handlepos="left"]');
      expect(targetHandle).toBeInTheDocument();
    });
  });
});