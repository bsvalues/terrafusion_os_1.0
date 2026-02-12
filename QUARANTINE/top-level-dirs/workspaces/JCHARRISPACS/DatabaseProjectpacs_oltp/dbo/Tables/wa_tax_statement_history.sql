CREATE TABLE [dbo].[wa_tax_statement_history] (
    [year]         NUMERIC (4) NOT NULL,
    [statement_id] INT         NOT NULL,
    [prop_id]      INT         NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_history] PRIMARY KEY CLUSTERED ([year] ASC, [statement_id] ASC) WITH (FILLFACTOR = 90)
);


GO

