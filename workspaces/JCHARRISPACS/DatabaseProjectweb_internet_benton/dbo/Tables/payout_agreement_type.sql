CREATE TABLE [dbo].[payout_agreement_type] (
    [payout_agreement_type_cd]   VARCHAR (10) NOT NULL,
    [payout_agreement_type_desc] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_payout_agreement_type] PRIMARY KEY CLUSTERED ([payout_agreement_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

