CREATE TABLE [dbo].[comp_sales_property_adj] (
    [lPropGridID]        INT             NOT NULL,
    [lCompPropID]        INT             NOT NULL,
    [lAdjFieldID]        INT             NOT NULL,
    [fAdjAmount]         NUMERIC (18, 6) NOT NULL,
    [szAdjReason]        VARCHAR (255)   NULL,
    [lImprovDetID]       INT             NULL,
    [lImprovAttributeID] INT             NULL,
    [lKey]               INT             IDENTITY (1, 1) NOT NULL,
    [lSaleID]            INT             NULL,
    CONSTRAINT [CPK_comp_sales_property_adj] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_comp_sales_property_adj_lAdjFieldID] FOREIGN KEY ([lAdjFieldID]) REFERENCES [dbo].[comp_sales_display_grid_fields] ([lFieldID]),
    CONSTRAINT [CFK_comp_sales_property_adj_lPropGridID] FOREIGN KEY ([lPropGridID]) REFERENCES [dbo].[comp_sales_property_grids] ([lPropGridID])
);


GO

CREATE NONCLUSTERED INDEX [idx_lPropGridID_lCompPropID]
    ON [dbo].[comp_sales_property_adj]([lPropGridID] ASC, [lCompPropID] ASC) WITH (FILLFACTOR = 100);


GO

