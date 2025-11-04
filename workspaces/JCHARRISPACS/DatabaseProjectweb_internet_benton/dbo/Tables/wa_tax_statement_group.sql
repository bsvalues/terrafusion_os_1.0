CREATE TABLE [dbo].[wa_tax_statement_group] (
    [group_id]               INT          NOT NULL,
    [year]                   NUMERIC (4)  NOT NULL,
    [description]            VARCHAR (50) NOT NULL,
    [include_property_taxes] BIT          NOT NULL,
    [include_assessments]    BIT          NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_group] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC) WITH (FILLFACTOR = 100)
);


GO

