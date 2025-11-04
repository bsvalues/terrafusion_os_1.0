CREATE TABLE [dbo].[comp_sales_property] (
    [lID]           INT IDENTITY (100000000, 1) NOT NULL,
    [lPropGridID]   INT NOT NULL,
    [lCompPropID]   INT NOT NULL,
    [lColWidthGrid] INT NOT NULL,
    [lSaleID]       INT NULL,
    CONSTRAINT [CPK_comp_sales_property] PRIMARY KEY CLUSTERED ([lID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_comp_sales_property_lPropGridID] FOREIGN KEY ([lPropGridID]) REFERENCES [dbo].[comp_sales_property_grids] ([lPropGridID])
);


GO

CREATE NONCLUSTERED INDEX [idx_lPropGridID_lCompPropID]
    ON [dbo].[comp_sales_property]([lPropGridID] ASC, [lCompPropID] ASC) WITH (FILLFACTOR = 90);


GO

