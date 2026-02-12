CREATE TABLE [dbo].[mineral_entity_cv] (
    [entity_id]       INT              NOT NULL,
    [prop_id]         INT              NOT NULL,
    [owner_id]        INT              NOT NULL,
    [tax_yr]          NUMERIC (4)      NOT NULL,
    [pp_seg_id]       INT              NOT NULL,
    [entity_prop_pct] NUMERIC (13, 10) NULL,
    [entity_code]     VARCHAR (10)     NULL,
    [xref]            VARCHAR (25)     NULL
);


GO

CREATE CLUSTERED INDEX [idx_xref]
    ON [dbo].[mineral_entity_cv]([xref] ASC) WITH (FILLFACTOR = 90);


GO

