import type { CurrentUseWorkflowTask } from './currentUseWorkflowTypes';

export async function getCurrentUseWorkflowTasks(
  parcelId: string,
): Promise<CurrentUseWorkflowTask[]> {
  const response = await fetch(`/api/dais/current-use/parcels/${parcelId}/tasks`);

  if (!response.ok) {
    throw new Error('Failed to load Current Use workflow tasks.');
  }

  return response.json();
}

export async function getCurrentUseWorkflowTasksMock(
  parcelId: string,
): Promise<CurrentUseWorkflowTask[]> {
  return [
    {
      id: 'task-001',
      countyId: 'benton-wa',
      parcelId,
      workflowType: 'MISSING_EVIDENCE_FOLLOWUP',
      status: 'WAITING_ON_OWNER',
      title: 'Request income proof',
      assignedTo: 'Current Use Desk',
      dueDate: '2026-04-15',
      priority: 'HIGH',
      summary: 'Income proof required for under-20-acre Farm & Ag classification.',
      createdAt: '2026-03-01T00:00:00.000Z',
      createdBy: 'demo.assessor@county.gov',
    },
    {
      id: 'task-002',
      countyId: 'benton-wa',
      parcelId,
      workflowType: 'OWNER_WITHDRAWAL',
      status: 'OPEN',
      title: 'Prepare voluntary withdrawal estimate',
      assignedTo: 'Current Use Desk',
      dueDate: '2026-03-30',
      priority: 'MEDIUM',
      summary: 'Generate rollback estimate and coordinate Treasurer payment handoff.',
      createdAt: '2026-03-10T00:00:00.000Z',
      createdBy: 'demo.assessor@county.gov',
    },
  ];
}
