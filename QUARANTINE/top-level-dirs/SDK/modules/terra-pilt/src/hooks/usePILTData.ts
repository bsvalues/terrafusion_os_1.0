import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export interface PiltStatus {
  status: string;
  fiscalYear: number;
  totalPayments: number;
  districts: number;
  federalAcres: number;
  averageRate: number;
}

export interface District { id: string; name: string; type: string }
export interface Receipt { id: string; fiscalYear: number; source: string; amount: number; status: string }
export interface CreateReceiptRequest { fiscalYear: number; source: string; amount: number }
export interface CalculationRequest { receiptId: string; weights?: Record<string, number> }
export interface Distribution { districtId: string; amount: number }
export interface CalculationResult { calculationId: string; receiptId: string; fiscalYear: number; totalAmount: number; distributions: Distribution[]; status: string }

export function usePiltStatus() {
  return useQuery<PiltStatus>({
    queryKey: ['pilt-status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/pilt/status`);
      if (!res.ok) throw new Error('Failed to fetch PILT status');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function usePiltDistricts() {
  return useQuery<{ count: number; districts: District[] }>({
    queryKey: ['pilt-districts'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/pilt/districts`);
      if (!res.ok) throw new Error('Failed to fetch districts');
      return res.json();
    },
    staleTime: 5 * 60_000,
  });
}

export function usePiltReceipts(fiscalYear?: number) {
  return useQuery<{ count: number; receipts: Receipt[] }>({
    queryKey: ['pilt-receipts', fiscalYear ?? 'current'],
    queryFn: async () => {
      const y = fiscalYear ?? new Date().getUTCFullYear();
      const res = await fetch(`${API_BASE}/api/pilt/receipts?fiscalYear=${y}`);
      if (!res.ok) throw new Error('Failed to fetch receipts');
      return res.json();
    },
  });
}

export function useCreateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateReceiptRequest) => {
      const res = await fetch(`${API_BASE}/api/pilt/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create receipt');
      return res.json() as Promise<Receipt>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pilt-receipts'] });
      qc.invalidateQueries({ queryKey: ['pilt-status'] });
    },
  });
}

export function usePiltCalculate() {
  return useMutation({
    mutationFn: async (req: CalculationRequest) => {
      const res = await fetch(`${API_BASE}/api/pilt/calculate/${encodeURIComponent(req.receiptId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: req.weights ?? {} }),
      });
      if (!res.ok) throw new Error('Failed to calculate');
      return res.json() as Promise<CalculationResult>;
    },
  });
}

export function usePiltApprove() {
  return useMutation({
    mutationFn: async (calculationId: string) => {
      const res = await fetch(`${API_BASE}/api/pilt/approve/${encodeURIComponent(calculationId)}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve');
      return res.json() as Promise<{ calculationId: string; status: string; approvedAt: string }>
    },
  });
}
