CREATE TABLE [dbo].[payout_agreement_fee_assoc] (
    [payout_agreement_id] INT NOT NULL,
    [fee_id]              INT NOT NULL,
    CONSTRAINT [CPK_payout_agreement_fee_assoc] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC, [fee_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_payout_agreement_fee_assoc_fee_id] FOREIGN KEY ([fee_id]) REFERENCES [dbo].[fee] ([fee_id]),
    CONSTRAINT [CFK_payout_agreement_fee_assoc_payout_agreement_id] FOREIGN KEY ([payout_agreement_id]) REFERENCES [dbo].[payout_agreement] ([payout_agreement_id])
);


GO

