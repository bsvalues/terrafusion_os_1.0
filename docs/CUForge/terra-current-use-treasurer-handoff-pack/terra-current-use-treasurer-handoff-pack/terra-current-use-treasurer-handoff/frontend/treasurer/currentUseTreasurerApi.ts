import type { CurrentUsePaymentPacket } from './currentUseTreasurerTypes';

export async function getCurrentUsePaymentPackets(
  parcelId: string,
): Promise<CurrentUsePaymentPacket[]> {
  const response = await fetch(`/api/treasurer/current-use/parcels/${parcelId}/payment-packets`);

  if (!response.ok) {
    throw new Error('Failed to load Current Use payment packets.');
  }

  return response.json();
}

export async function getCurrentUsePaymentPacketsMock(
  parcelId: string,
): Promise<CurrentUsePaymentPacket[]> {
  return [
    {
      paymentPacketId: 'pay-001',
      countyId: 'benton-wa',
      parcelId,
      rollbackCalculationId: 'calc-001',
      calculationVersion: 'CU_ROLLBACK_ENGINE_v2026_03_01',
      status: 'SENT_TO_TREASURER',
      payeeName: 'Sample Owner',
      treasurerReferenceNumber: 'TR-CU-2026-0001',
      lines: [
        {
          lineType: 'ADDITIONAL_TAX',
          description: 'Current Use additional tax subtotal',
          amount: 10422.55,
        },
        {
          lineType: 'INTEREST',
          description: 'Current Use statutory interest subtotal',
          amount: 818.0,
        },
      ],
      totalDue: 11240.55,
      createdAt: '2026-03-15T18:10:00.000Z',
      createdBy: 'demo.assessor@county.gov',
      sentToTreasurerAt: '2026-03-15T18:20:00.000Z',
      sentToTreasurerBy: 'demo.assessor@county.gov',
    },
  ];
}
