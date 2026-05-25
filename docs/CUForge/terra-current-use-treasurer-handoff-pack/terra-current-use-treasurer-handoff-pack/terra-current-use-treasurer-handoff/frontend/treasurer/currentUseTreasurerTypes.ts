export type CurrentUsePaymentPacketStatus =
  | 'DRAFT'
  | 'READY_FOR_TREASURER'
  | 'SENT_TO_TREASURER'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'VOIDED'
  | 'RECALCULATION_REQUIRED';

export type CurrentUsePaymentLineType =
  | 'ADDITIONAL_TAX'
  | 'INTEREST'
  | 'PENALTY'
  | 'RECORDING_FEE'
  | 'OTHER';

export interface CurrentUsePaymentLine {
  lineType: CurrentUsePaymentLineType;
  taxYear?: number;
  description: string;
  amount: number;
}

export interface CurrentUsePaymentPacket {
  paymentPacketId: string;
  countyId: string;
  parcelId: string;
  classificationId?: string;
  removalId?: string;
  rollbackCalculationId: string;
  calculationVersion: string;
  status: CurrentUsePaymentPacketStatus;
  lines: CurrentUsePaymentLine[];
  totalDue: number;
  payeeName: string;
  treasurerReferenceNumber?: string;
  createdAt: string;
  createdBy: string;
  sentToTreasurerAt?: string;
  sentToTreasurerBy?: string;
  paidAt?: string;
  receiptNumber?: string;
}
