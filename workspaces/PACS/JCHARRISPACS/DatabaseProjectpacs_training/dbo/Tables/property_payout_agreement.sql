CREATE TABLE [dbo].[property_payout_agreement] (
    [payout_agreement_id] INT         NOT NULL,
    [year]                NUMERIC (4) NOT NULL,
    [sup_num]             INT         NOT NULL,
    [prop_id]             INT         NOT NULL,
    [is_primary]          BIT         NOT NULL,
    CONSTRAINT [CPK_property_payout_agreement] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC, [year] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_payout_agreement_payout_agreement_id] FOREIGN KEY ([payout_agreement_id]) REFERENCES [dbo].[payout_agreement] ([payout_agreement_id])
);


GO

