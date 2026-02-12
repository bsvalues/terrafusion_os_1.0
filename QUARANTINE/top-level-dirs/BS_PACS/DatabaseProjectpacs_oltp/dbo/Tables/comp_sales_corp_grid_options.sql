CREATE TABLE [dbo].[comp_sales_corp_grid_options] (
    [lPropGridID] INT      NOT NULL,
    [lBPPValue]   INT      NOT NULL,
    [cSystemBPP]  CHAR (1) CONSTRAINT [CDF_comp_sales_corp_grid_options_cSystemBPP] DEFAULT ('T') NOT NULL,
    [lOGBValue]   INT      CONSTRAINT [CDF_comp_sales_corp_grid_options_lOGBValue] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_comp_sales_corp_grid_options] PRIMARY KEY CLUSTERED ([lPropGridID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_comp_sales_corp_grid_options_lPropGridID] FOREIGN KEY ([lPropGridID]) REFERENCES [dbo].[comp_sales_property_grids] ([lPropGridID])
);


GO

