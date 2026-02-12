CREATE TABLE [dbo].[payout_agreement_bill_assoc] (
    [payout_agreement_id] INT NOT NULL,
    [bill_id]             INT NOT NULL,
    CONSTRAINT [CPK_payout_agreement_bill_assoc] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC, [bill_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_payout_agreement_bill_assoc_bill_id] FOREIGN KEY ([bill_id]) REFERENCES [dbo].[bill] ([bill_id]),
    CONSTRAINT [CFK_payout_agreement_bill_assoc_payout_agreement_id] FOREIGN KEY ([payout_agreement_id]) REFERENCES [dbo].[payout_agreement] ([payout_agreement_id])
);


GO

