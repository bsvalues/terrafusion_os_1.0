CREATE TABLE [dbo].[tax_statement_config_detail] (
    [tax_statement_cd] VARCHAR (50) NOT NULL,
    [field_value]      VARCHAR (30) NOT NULL,
    [source_table]     VARCHAR (30) NOT NULL,
    [source_column]    VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_tax_statement_config_detail] PRIMARY KEY CLUSTERED ([tax_statement_cd] ASC, [source_table] ASC, [source_column] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_tax_statement_config_detail_source_table] CHECK ([source_table]='litigation_event_type' OR [source_table]='assessment_type' OR [source_table]='exmpt_type' OR [source_table]='annexation' OR [source_table]='bill_fee_code' OR [source_table]='property_type')
);


GO

