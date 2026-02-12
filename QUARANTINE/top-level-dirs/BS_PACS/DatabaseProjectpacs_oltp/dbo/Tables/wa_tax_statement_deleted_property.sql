CREATE TABLE [dbo].[wa_tax_statement_deleted_property] (
    [group_id]               INT         NOT NULL,
    [year]                   NUMERIC (4) NOT NULL,
    [run_id]                 INT         NOT NULL,
    [prop_id]                INT         NOT NULL,
    [latest_year_with_value] NUMERIC (4) NOT NULL,
    PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_wa_tax_statement_deleted_property_wa_tax_statement_run] FOREIGN KEY ([group_id], [year], [run_id]) REFERENCES [dbo].[wa_tax_statement_run] ([group_id], [year], [run_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Run ID of the statement run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_deleted_property', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The property that could not be included in the statement run because it was deleted.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_deleted_property', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The latest year of the property with delinquent value.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_deleted_property', @level2type = N'COLUMN', @level2name = N'latest_year_with_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Deleted property statements that were found when creating a statement run, saved to be printed in additional runs.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_deleted_property';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Group ID of the statement run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_deleted_property', @level2type = N'COLUMN', @level2name = N'group_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Year of the statement run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_deleted_property', @level2type = N'COLUMN', @level2name = N'year';


GO

