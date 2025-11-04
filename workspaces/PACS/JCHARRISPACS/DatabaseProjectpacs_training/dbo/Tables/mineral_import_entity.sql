CREATE TABLE [dbo].[mineral_import_entity] (
    [run_id]          INT              NOT NULL,
    [entity_id]       INT              NOT NULL,
    [prop_id]         INT              NOT NULL,
    [owner_id]        INT              NOT NULL,
    [tax_yr]          NUMERIC (4)      NOT NULL,
    [pp_seg_id]       INT              NOT NULL,
    [entity_prop_pct] NUMERIC (13, 10) NULL,
    [entity_code]     VARCHAR (10)     NULL,
    [xref]            VARCHAR (50)     NULL,
    [entity_def]      BIT              CONSTRAINT [CDF_mineral_import_entity_entity_def] DEFAULT (1) NOT NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_entity_id]
    ON [dbo].[mineral_import_entity]([entity_id] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_entity_code]
    ON [dbo].[mineral_import_entity]([entity_code] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_entity]([run_id] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_xref]
    ON [dbo].[mineral_import_entity]([xref] ASC);


GO

