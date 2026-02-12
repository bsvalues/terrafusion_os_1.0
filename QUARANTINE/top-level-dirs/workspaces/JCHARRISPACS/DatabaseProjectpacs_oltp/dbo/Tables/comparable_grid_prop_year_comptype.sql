CREATE TABLE [dbo].[comparable_grid_prop_year_comptype] (
    [lYear]                NUMERIC (4) NOT NULL,
    [lPropID]              INT         NOT NULL,
    [szCompType]           CHAR (1)    NOT NULL,
    [lPropGridID]          INT         NULL,
    [lMarketValPropGridID] INT         NULL,
    CONSTRAINT [CPK_comparable_grid_prop_year_comptype] PRIMARY KEY CLUSTERED ([lYear] ASC, [lPropID] ASC, [szCompType] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_comparable_grid_prop_year_comptype_lPropGridID] FOREIGN KEY ([lPropGridID]) REFERENCES [dbo].[comp_sales_property_grids] ([lPropGridID])
);


GO

CREATE NONCLUSTERED INDEX [idx_lPropGridID]
    ON [dbo].[comparable_grid_prop_year_comptype]([lPropGridID] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_lMarketValPropGridID]
    ON [dbo].[comparable_grid_prop_year_comptype]([lMarketValPropGridID] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The comparable grid ID of the grid used for market approach valuation.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comparable_grid_prop_year_comptype', @level2type = N'COLUMN', @level2name = N'lMarketValPropGridID';


GO

