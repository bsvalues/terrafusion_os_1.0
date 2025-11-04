CREATE TABLE [dbo].[mineral_import_special_entity_exemption] (
    [run_id]        INT             NOT NULL,
    [prop_id]       INT             NOT NULL,
    [owner_id]      INT             NOT NULL,
    [sup_num]       INT             NOT NULL,
    [exmpt_tax_yr]  NUMERIC (4)     NOT NULL,
    [owner_tax_yr]  NUMERIC (4)     NOT NULL,
    [exmpt_type_cd] VARCHAR (10)    NOT NULL,
    [entity_id]     INT             NOT NULL,
    [entity_code]   VARCHAR (10)    NULL,
    [sp_amt]        NUMERIC (14, 2) NULL,
    [sp_pct]        NUMERIC (5, 2)  NULL,
    [xref]          VARCHAR (50)    NULL,
    [entity_def]    BIT             CONSTRAINT [CDF_mineral_import_special_entity_exemption_entity_def] DEFAULT (1) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_special_entity_exemption]([run_id] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_xref]
    ON [dbo].[mineral_import_special_entity_exemption]([xref] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_entity_def]
    ON [dbo].[mineral_import_special_entity_exemption]([entity_def] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_entity_id]
    ON [dbo].[mineral_import_special_entity_exemption]([entity_id] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_entity_code]
    ON [dbo].[mineral_import_special_entity_exemption]([entity_code] ASC);


GO

