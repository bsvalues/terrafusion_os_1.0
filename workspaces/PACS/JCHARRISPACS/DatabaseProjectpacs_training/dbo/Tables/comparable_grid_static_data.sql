CREATE TABLE [dbo].[comparable_grid_static_data] (
    [lStaticGridItemID] BIGINT        IDENTITY (100000000, 1) NOT NULL,
    [lPropGridID]       INT           NOT NULL,
    [lColumn]           INT           NOT NULL,
    [lFieldID]          INT           NOT NULL,
    [szLeft]            VARCHAR (255) NULL,
    [szRight]           VARCHAR (63)  NULL,
    [szDetail]          VARCHAR (255) NULL,
    CONSTRAINT [CPK_comparable_grid_static_data] PRIMARY KEY CLUSTERED ([lStaticGridItemID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_comparable_grid_static_data_lPropGridID] FOREIGN KEY ([lPropGridID]) REFERENCES [dbo].[comp_sales_property_grids] ([lPropGridID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [idx_lPropGridID]
    ON [dbo].[comparable_grid_static_data]([lPropGridID] ASC) WITH (FILLFACTOR = 90);


GO

