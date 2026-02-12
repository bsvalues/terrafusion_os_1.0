CREATE TABLE [dbo].[wa_tax_statement_assessment] (
    [group_id]     INT         NOT NULL,
    [year]         NUMERIC (4) NOT NULL,
    [combine_fees] BIT         NOT NULL,
    [agency_id]    INT         NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_assessment] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [agency_id] ASC),
    CONSTRAINT [CFK_wa_tax_statement_assessment_group_id_year] FOREIGN KEY ([group_id], [year]) REFERENCES [dbo].[wa_tax_statement_group] ([group_id], [year])
);


GO

