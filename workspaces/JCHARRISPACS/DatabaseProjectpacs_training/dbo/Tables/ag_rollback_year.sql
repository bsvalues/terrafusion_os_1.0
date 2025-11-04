CREATE TABLE [dbo].[ag_rollback_year] (
    [prop_id]           INT             NOT NULL,
    [owner_id]          INT             NOT NULL,
    [ag_rollbk_id]      INT             NOT NULL,
    [ag_rollbk_tax_yr]  NUMERIC (4)     NOT NULL,
    [ag_rollbk_ag_val]  NUMERIC (14, 2) NULL,
    [ag_rollbk_mkt_val] NUMERIC (14, 2) NULL,
    [ag_acres]          NUMERIC (14, 4) NULL,
    CONSTRAINT [CPK_ag_rollback_year] PRIMARY KEY CLUSTERED ([prop_id] ASC, [owner_id] ASC, [ag_rollbk_id] ASC, [ag_rollbk_tax_yr] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_ag_rollbk_id_prop_id]
    ON [dbo].[ag_rollback_year]([ag_rollbk_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90);


GO

