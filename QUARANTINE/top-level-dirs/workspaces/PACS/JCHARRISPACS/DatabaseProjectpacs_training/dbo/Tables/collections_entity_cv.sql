CREATE TABLE [dbo].[collections_entity_cv] (
    [entity_id]       INT              NOT NULL,
    [prop_id]         INT              NOT NULL,
    [owner_id]        INT              NOT NULL,
    [tax_yr]          NUMERIC (4)      NOT NULL,
    [pp_seg_id]       INT              NOT NULL,
    [entity_prop_pct] NUMERIC (13, 10) NULL,
    [entity_code]     VARCHAR (10)     NULL,
    CONSTRAINT [CPK_collections_entity_cv] PRIMARY KEY NONCLUSTERED ([entity_id] ASC, [prop_id] ASC, [owner_id] ASC, [tax_yr] ASC, [pp_seg_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_collections_entity_cv_owner_id] FOREIGN KEY ([owner_id]) REFERENCES [dbo].[collections_owner_cv] ([acct_id])
);


GO

