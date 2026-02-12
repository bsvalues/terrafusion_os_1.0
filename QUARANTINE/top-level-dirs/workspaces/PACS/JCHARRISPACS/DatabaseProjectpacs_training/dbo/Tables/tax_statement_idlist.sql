CREATE TABLE [dbo].[tax_statement_idlist] (
    [dataset_id] INT NOT NULL,
    [id]         INT NOT NULL,
    CONSTRAINT [CPK_tax_statement_idlist] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [id] ASC) WITH (FILLFACTOR = 100)
);


GO

