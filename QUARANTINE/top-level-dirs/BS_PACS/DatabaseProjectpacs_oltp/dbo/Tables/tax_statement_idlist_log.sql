CREATE TABLE [dbo].[tax_statement_idlist_log] (
    [dataset_id]  INT      NOT NULL,
    [datecreated] DATETIME NOT NULL,
    CONSTRAINT [CPK_table_name] PRIMARY KEY CLUSTERED ([dataset_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'this table is created to log the date for the records created in tax_statement_idlist table. 
  This is to resolve the issues created from the leftover data in tax_statement_idlist table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_statement_idlist_log';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'holds data set id from tax_statement_idlist table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_statement_idlist_log', @level2type = N'COLUMN', @level2name = N'dataset_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'holds tax_statement_idlist table record creation date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_statement_idlist_log', @level2type = N'COLUMN', @level2name = N'datecreated';


GO

