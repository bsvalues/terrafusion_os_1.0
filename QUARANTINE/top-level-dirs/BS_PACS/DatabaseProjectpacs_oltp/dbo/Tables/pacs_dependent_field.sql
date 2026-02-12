CREATE TABLE [dbo].[pacs_dependent_field] (
    [dependency_id]           INT           NOT NULL,
    [table_name]              VARCHAR (50)  NOT NULL,
    [column_name]             VARCHAR (50)  NOT NULL,
    [dependent_on_table]      VARCHAR (50)  NOT NULL,
    [dependent_on_column]     VARCHAR (50)  NOT NULL,
    [dependent_on_value]      VARCHAR (100) NULL,
    [dependent_on_comparator] INT           NULL,
    [dependency_met_action]   INT           NOT NULL,
    CONSTRAINT [CPK_pacs_dependent_field] PRIMARY KEY CLUSTERED ([dependency_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Dependency Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_dependent_field', @level2type = N'COLUMN', @level2name = N'dependent_on_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Dependent Field Table Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_dependent_field', @level2type = N'COLUMN', @level2name = N'table_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Dependency Comparator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_dependent_field', @level2type = N'COLUMN', @level2name = N'dependent_on_comparator';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Dependent Field Column Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_dependent_field', @level2type = N'COLUMN', @level2name = N'column_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Action to Perform when Dependency is Met', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_dependent_field', @level2type = N'COLUMN', @level2name = N'dependency_met_action';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Dependent On Field Table Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_dependent_field', @level2type = N'COLUMN', @level2name = N'dependent_on_table';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Mapping table for field dependencies', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_dependent_field';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Dependent on Field Column Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_dependent_field', @level2type = N'COLUMN', @level2name = N'dependent_on_column';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Primary Key for a dependency', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_dependent_field', @level2type = N'COLUMN', @level2name = N'dependency_id';


GO

