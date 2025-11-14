export type Role = 'levy_clerk' | 'dor_analyst' | 'budget_officer' | 'research_phd' | 'admin';

export const RoleLabels: Record<Role, string> = {
  levy_clerk: 'Levy Clerk',
  dor_analyst: 'Dept. of Revenue Analyst',
  budget_officer: 'County Budgeting',
  research_phd: 'Quantum AI Research',
  admin: 'Administrator',
};

export const DefaultRole: Role = 'levy_clerk';
