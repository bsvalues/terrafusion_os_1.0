CREATE TABLE [dbo].[collections_exemption_cv] (
    [prop_id]         INT         NOT NULL,
    [owner_id]        INT         NOT NULL,
    [exmpt_tax_yr]    NUMERIC (4) NOT NULL,
    [owner_tax_yr]    NUMERIC (4) NOT NULL,
    [prop_type_cd]    CHAR (5)    NOT NULL,
    [exmpt_type_cd]   CHAR (5)    NOT NULL,
    [sup_num]         INT         NOT NULL,
    [sp_value_type]   CHAR (1)    NULL,
    [sp_value_option] CHAR (1)    NULL,
    CONSTRAINT [CPK_collections_exemption_cv] PRIMARY KEY NONCLUSTERED ([prop_id] ASC, [owner_id] ASC, [exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [prop_type_cd] ASC, [exmpt_type_cd] ASC, [sup_num] ASC) WITH (FILLFACTOR = 90)
);


GO

