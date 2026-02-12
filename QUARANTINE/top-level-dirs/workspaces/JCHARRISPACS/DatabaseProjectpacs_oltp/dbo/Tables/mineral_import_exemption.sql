CREATE TABLE [dbo].[mineral_import_exemption] (
    [run_id]          INT          NOT NULL,
    [prop_id]         INT          NOT NULL,
    [owner_id]        INT          NOT NULL,
    [exmpt_tax_yr]    NUMERIC (4)  NOT NULL,
    [owner_tax_yr]    NUMERIC (4)  NOT NULL,
    [prop_type_cd]    CHAR (5)     NULL,
    [exmpt_type_cd]   VARCHAR (10) NULL,
    [sup_num]         INT          NOT NULL,
    [sp_value_type]   CHAR (1)     NULL,
    [sp_value_option] CHAR (1)     NULL,
    [xref]            VARCHAR (50) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_xref]
    ON [dbo].[mineral_import_exemption]([xref] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_exemption]([run_id] ASC);


GO

