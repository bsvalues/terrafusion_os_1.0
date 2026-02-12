CREATE TABLE [dbo].[payout_agreement_fee_assoc] (
    [payout_agreement_id] INT NOT NULL,
    [fee_id]              INT NOT NULL,
    CONSTRAINT [CPK_payout_agreement_fee_assoc] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC, [fee_id] ASC) WITH (FILLFACTOR = 90)
);


GO

