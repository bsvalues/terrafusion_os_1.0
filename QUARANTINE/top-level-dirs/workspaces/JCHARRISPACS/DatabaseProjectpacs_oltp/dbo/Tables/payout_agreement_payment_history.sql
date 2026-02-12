CREATE TABLE [dbo].[payout_agreement_payment_history] (
    [payout_agreement_id]          INT NOT NULL,
    [payment_id]                   INT NOT NULL,
    [payout_agreement_schedule_id] INT DEFAULT ((-1)) NOT NULL,
    CONSTRAINT [CPK_payout_agreement_payment_history] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC, [payment_id] ASC, [payout_agreement_schedule_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_payout_agreement_payment_history_payout_agreement_id] FOREIGN KEY ([payout_agreement_id]) REFERENCES [dbo].[payout_agreement] ([payout_agreement_id])
);


GO

