CREATE TABLE [dbo].[prop_gis_ids] (
    [prop_id]          INT           NOT NULL,
    [prop_val_yr]      NUMERIC (4)   NOT NULL,
    [sup_num]          INT           NOT NULL,
    [extension]        VARCHAR (3)   NOT NULL,
    [block]            VARCHAR (4)   NULL,
    [lot_tract]        VARCHAR (4)   NULL,
    [legal_desc]       VARCHAR (255) NULL,
    [auto_build_legal] VARCHAR (1)   NULL,
    CONSTRAINT [CPK_prop_gis_ids] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC, [extension] ASC) WITH (FILLFACTOR = 90)
);


GO

