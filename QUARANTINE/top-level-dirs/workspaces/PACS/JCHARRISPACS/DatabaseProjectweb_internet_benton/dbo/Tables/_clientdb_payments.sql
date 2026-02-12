CREATE TABLE [dbo].[_clientdb_payments] (
    [prop_id]      INT         NOT NULL,
    [year]         NUMERIC (4) NOT NULL,
    [statement_id] INT         NOT NULL,
    [paid]         BIT         DEFAULT ((0)) NOT NULL,
    PRIMARY KEY CLUSTERED ([prop_id] ASC, [year] ASC, [statement_id] ASC) WITH (FILLFACTOR = 100)
);


GO

