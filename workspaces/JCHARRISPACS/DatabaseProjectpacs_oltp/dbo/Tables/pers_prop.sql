CREATE TABLE [dbo].[pers_prop] (
    [prop_id]             INT          NOT NULL,
    [prop_val_yr]         NUMERIC (4)  NOT NULL,
    [pp_id]               INT          NOT NULL,
    [personal_prop_value] INT          NOT NULL,
    [pp_rend_val]         NUMERIC (18) NULL,
    [pp_rend_yr]          NUMERIC (4)  NULL,
    [sic_cd]              VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_pers_prop] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [pp_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_pers_prop_sic_cd] FOREIGN KEY ([sic_cd]) REFERENCES [dbo].[sic_code] ([sic_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_val_yr_prop_id]
    ON [dbo].[pers_prop]([prop_val_yr] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sic_cd]
    ON [dbo].[pers_prop]([sic_cd] ASC) WITH (FILLFACTOR = 90);


GO

