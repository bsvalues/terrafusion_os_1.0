CREATE TABLE [dbo].[comp_sales_temp_property] (
    [lID]             INT IDENTITY (100000000, 1) NOT NULL,
    [lTempPropGridID] INT NOT NULL,
    [lCompPropID]     INT NOT NULL,
    [lColWidthGrid]   INT NOT NULL,
    [lSaleID]         INT NULL,
    CONSTRAINT [CPK_comp_sales_temp_property] PRIMARY KEY CLUSTERED ([lID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_comp_sales_temp_property_lTempPropGridID] FOREIGN KEY ([lTempPropGridID]) REFERENCES [dbo].[comp_sales_temp_property_grids] ([lTempPropGridID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [idx_lTempPropGridID]
    ON [dbo].[comp_sales_temp_property]([lTempPropGridID] ASC) WITH (FILLFACTOR = 90);


GO

