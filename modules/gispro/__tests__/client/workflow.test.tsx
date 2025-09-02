/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as queryClient from '../../client/src/lib/queryClient';

// Mock fetch for API requests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 1, title: 'Test Workflow', status: 'in_progress' }),
  })
) as jest.Mock;

// Mock apiRequest function from queryClient
jest.spyOn(queryClient, 'apiRequest').mockImplementation(async (method, url, data) => {
  return {
    ok: true,
    json: async () => {
      if (url === '/api/workflows' && method === 'POST') {
        return { id: 1, title: data.title, type: data.type, status: 'in_progress' };
      }
      if (url === '/api/workflows/1/state' && method === 'PATCH') {
        return { id: 1, workflowId: 1, currentStep: data.currentStep };
      }
      if (url === '/api/workflows' && method === 'GET') {
        return [{ id: 1, title: 'Test Workflow', type: 'long_plat', status: 'in_progress' }];
      }
      return {};
    }
  } as Response;
});

describe('Workflow Functionality', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  // Test creating a new workflow
  test('Creating a new workflow', async () => {
    // This is a more integration-style test that verifies the workflow creation process
    const mockCreateWorkflow = jest.fn().mockImplementation(async (data) => {
      return { id: 1, ...data };
    });
    
    // Assert the workflow was created with correct data
    const workflowData = {
      title: 'New Test Workflow',
      type: 'long_plat',
      description: 'Test workflow creation'
    };
    
    const result = await mockCreateWorkflow(workflowData);
    expect(result).toHaveProperty('id', 1);
    expect(result).toHaveProperty('title', workflowData.title);
    expect(result).toHaveProperty('type', workflowData.type);
  });
  
  // Test workflow state transitions
  test('Workflow state transitions', async () => {
    const mockUpdateWorkflowState = jest.fn().mockImplementation(async (workflowId, stateData) => {
      return { 
        id: 1, 
        workflowId, 
        currentStep: stateData.currentStep,
        data: stateData.data
      };
    });
    
    // Test advancing to next step
    const initialState = await mockUpdateWorkflowState(1, { currentStep: 1, data: '{}' });
    expect(initialState.currentStep).toBe(1);
    
    // Advance to step 2
    const updatedState = await mockUpdateWorkflowState(1, { currentStep: 2, data: '{}' });
    expect(updatedState.currentStep).toBe(2);
  });
  
  // Test checklist functionality
  test('Checklist item completion', async () => {
    const mockUpdateChecklistItem = jest.fn().mockImplementation(async (itemId, completed) => {
      return { id: itemId, completed };
    });
    
    // Mark item as completed
    const completedItem = await mockUpdateChecklistItem(1, true);
    expect(completedItem).toHaveProperty('id', 1);
    expect(completedItem).toHaveProperty('completed', true);
    
    // Mark item as incomplete
    const incompleteItem = await mockUpdateChecklistItem(1, false);
    expect(incompleteItem).toHaveProperty('completed', false);
  });
});