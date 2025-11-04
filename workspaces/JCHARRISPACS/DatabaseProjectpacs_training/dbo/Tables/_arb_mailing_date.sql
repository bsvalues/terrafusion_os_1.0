CREATE TABLE [dbo].[_arb_mailing_date] (
    [szHostName]    VARCHAR (255) NOT NULL,
    [szMailingDate] VARCHAR (32)  NULL,
    CONSTRAINT [CPK__arb_mailing_date] PRIMARY KEY CLUSTERED ([szHostName] ASC) WITH (FILLFACTOR = 90)
);


GO

