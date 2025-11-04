CREATE TABLE [dbo].[payout_agreement_schedule] (
    [payout_agreement_id]            INT             NOT NULL,
    [payout_agreement_schedule_id]   INT             NOT NULL,
    [principal_amount_due]           NUMERIC (14, 2) NOT NULL,
    [bond_interest_due]              NUMERIC (14, 2) NOT NULL,
    [delq_interest_due]              NUMERIC (14, 2) NOT NULL,
    [penalty_due]                    NUMERIC (14, 2) NOT NULL,
    [payment_amount_due]             NUMERIC (14, 2) NOT NULL,
    [amount_paid]                    NUMERIC (14, 2) NOT NULL,
    [due_date]                       DATETIME        NOT NULL,
    [date_paid]                      DATETIME        NULL,
    [remaining_principal_amount_due] NUMERIC (14, 2) NOT NULL,
    [collection_fee_amount]          NUMERIC (14, 2) NOT NULL,
    CONSTRAINT [CPK_payout_agreement_schedule] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC, [payout_agreement_schedule_id] ASC) WITH (FILLFACTOR = 90)
);


GO

