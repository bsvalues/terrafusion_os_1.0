CREATE TABLE [dbo].[next_statement_id] (
    [statement_yr]      NUMERIC (4) NOT NULL,
    [next_statement_id] INT         NOT NULL,
    CONSTRAINT [CPK_next_statement_id] PRIMARY KEY CLUSTERED ([statement_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

