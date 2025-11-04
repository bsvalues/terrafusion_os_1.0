CREATE TABLE [dbo].[comparable_grid_live_data] (
    [lStaticGridItemID] BIGINT        IDENTITY (100000000, 1) NOT NULL,
    [lTempPropGridID]   INT           NOT NULL,
    [lColumn]           INT           NOT NULL,
    [lFieldID]          INT           NOT NULL,
    [szLeft]            VARCHAR (255) NULL,
    [szRight]           VARCHAR (63)  NULL,
    [szDetail]          VARCHAR (255) NULL,
    CONSTRAINT [CPK_comparable_grid_live_data] PRIMARY KEY CLUSTERED ([lStaticGridItemID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_comparable_grid_live_data_lTempPropGridID] FOREIGN KEY ([lTempPropGridID]) REFERENCES [dbo].[comp_sales_temp_property_grids] ([lTempPropGridID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [idx_lTempPropGridID]
    ON [dbo].[comparable_grid_live_data]([lTempPropGridID] ASC) WITH (FILLFACTOR = 90);


GO

