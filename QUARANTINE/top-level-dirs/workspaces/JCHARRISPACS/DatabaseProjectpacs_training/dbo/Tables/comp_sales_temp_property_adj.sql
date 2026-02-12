CREATE TABLE [dbo].[comp_sales_temp_property_adj] (
    [lTempPropGridID]    INT             NOT NULL,
    [lCompPropID]        INT             NOT NULL,
    [lAdjFieldID]        INT             NOT NULL,
    [fAdjAmount]         NUMERIC (18, 6) NOT NULL,
    [szAdjReason]        VARCHAR (255)   NULL,
    [lImprovDetID]       INT             NULL,
    [lImprovAttributeID] INT             NULL,
    [lKey]               INT             IDENTITY (1, 1) NOT NULL,
    [bSystemAdj]         BIT             CONSTRAINT [CDF_comp_sales_temp_property_adj_bSystemAdj] DEFAULT (0) NOT NULL,
    [fUserAdjAmount]     NUMERIC (18, 6) NULL,
    [lSaleID]            INT             NULL,
    CONSTRAINT [CPK_comp_sales_temp_property_adj] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_comp_sales_temp_property_adj_lTempPropGridID] FOREIGN KEY ([lTempPropGridID]) REFERENCES [dbo].[comp_sales_temp_property_grids] ([lTempPropGridID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [idx_lTempPropGridID]
    ON [dbo].[comp_sales_temp_property_adj]([lTempPropGridID] ASC) WITH (FILLFACTOR = 90);


GO

