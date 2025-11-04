CREATE TABLE [dbo].[mineral_exemption_cv] (
    [prop_id]         INT          NOT NULL,
    [owner_id]        INT          NOT NULL,
    [exmpt_tax_yr]    NUMERIC (4)  NOT NULL,
    [owner_tax_yr]    NUMERIC (4)  NOT NULL,
    [prop_type_cd]    CHAR (5)     NULL,
    [exmpt_type_cd]   CHAR (5)     NULL,
    [sup_num]         INT          NOT NULL,
    [sp_value_type]   CHAR (1)     NULL,
    [sp_value_option] CHAR (1)     NULL,
    [xref]            VARCHAR (25) NULL
);


GO

CREATE CLUSTERED INDEX [idx_xref]
    ON [dbo].[mineral_exemption_cv]([xref] ASC) WITH (FILLFACTOR = 90);


GO

