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
    [remaining_principal_amount_due] NUMERIC (14, 2) CONSTRAINT [CDF_payout_agreement_schedule_remaining_principal_amount_due] DEFAULT ((0)) NOT NULL,
    [collection_fee_amount]          NUMERIC (14, 2) CONSTRAINT [CDF_payout_agreement_schedule_collection_fee_amount] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_payout_agreement_schedule] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC, [payout_agreement_schedule_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_payout_agreement_schedule_payout_agreement_id] FOREIGN KEY ([payout_agreement_id]) REFERENCES [dbo].[payout_agreement] ([payout_agreement_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Holds Payout Agreement Collection Fee', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'payout_agreement_schedule', @level2type = N'COLUMN', @level2name = N'collection_fee_amount';


GO

