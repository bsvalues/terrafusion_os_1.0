CREATE TABLE [dbo].[comp_sales_temp_corp_grid_options] (
    [lTempPropGridID] INT      NOT NULL,
    [lBPPValue]       INT      NOT NULL,
    [cSystemBPP]      CHAR (1) NOT NULL,
    [lOGBValue]       INT      NOT NULL,
    CONSTRAINT [CPK_comp_sales_temp_corp_grid_options] PRIMARY KEY CLUSTERED ([lTempPropGridID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_comp_sales_temp_corp_grid_options_lTempPropGridID] FOREIGN KEY ([lTempPropGridID]) REFERENCES [dbo].[comp_sales_temp_property_grids] ([lTempPropGridID]) ON DELETE CASCADE
);


GO

