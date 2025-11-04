CREATE TABLE [dbo].[payout_agreement_status_code] (
    [payout_agreement_status_cd]   VARCHAR (10) NOT NULL,
    [payout_agreement_status_desc] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_payout_agreement_status_code] PRIMARY KEY CLUSTERED ([payout_agreement_status_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

