CREATE TABLE [dbo].[payout_agreement_bill_assoc] (
    [payout_agreement_id] INT NOT NULL,
    [bill_id]             INT NOT NULL,
    CONSTRAINT [CPK_payout_agreement_bill_assoc] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC, [bill_id] ASC) WITH (FILLFACTOR = 90)
);


GO

