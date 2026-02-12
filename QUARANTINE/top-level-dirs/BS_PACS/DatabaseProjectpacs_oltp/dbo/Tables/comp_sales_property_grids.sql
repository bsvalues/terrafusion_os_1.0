CREATE TABLE [dbo].[comp_sales_property_grids] (
    [lPropGridID]      INT           IDENTITY (100000000, 1) NOT NULL,
    [lSubjectPropID]   INT           NOT NULL,
    [szGridName]       VARCHAR (64)  NULL,
    [lGridID]          INT           NOT NULL,
    [lColWidthFields]  INT           NOT NULL,
    [lColWidthSubject] INT           NOT NULL,
    [lPrecision]       INT           CONSTRAINT [CDF_comp_sales_property_grids_lPrecision] DEFAULT (2) NOT NULL,
    [dtCreated]        DATETIME      CONSTRAINT [CDF_comp_sales_property_grids_dtCreated] DEFAULT (getdate()) NOT NULL,
    [lPacsUserID]      INT           CONSTRAINT [CDF_comp_sales_property_grids_lPacsUserID] DEFAULT (0) NOT NULL,
    [lYear]            NUMERIC (4)   NOT NULL,
    [szComments]       VARCHAR (500) NULL,
    [comparison_type]  CHAR (1)      CONSTRAINT [CDF_comp_sales_property_grids_comparison_type] DEFAULT ('S') NULL,
    [cShowDate]        CHAR (1)      NULL,
    [bStatic]          BIT           CONSTRAINT [CDF_comp_sales_property_grids_bStatic] DEFAULT (0) NOT NULL,
    [lGridIDCard]      INT           CONSTRAINT [CDF_comp_sales_property_grids_lGridIDCard] DEFAULT (0) NOT NULL,
    [dtMarket]         DATETIME      NOT NULL,
    [bPrintComments]   BIT           CONSTRAINT [CDF_comp_sales_property_grids_bPrintComments] DEFAULT ((0)) NOT NULL,
    [szPrintComments]  VARCHAR (500) NULL,
    CONSTRAINT [CPK_comp_sales_property_grids] PRIMARY KEY CLUSTERED ([lPropGridID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_comp_sales_property_grids_lGridID] FOREIGN KEY ([lGridID]) REFERENCES [dbo].[comp_sales_display_grid] ([lGridID]),
    CONSTRAINT [CFK_comp_sales_property_grids_lGridIDCard] FOREIGN KEY ([lGridIDCard]) REFERENCES [dbo].[comp_sales_display_grid] ([lGridID])
);


GO

CREATE NONCLUSTERED INDEX [idx_lSubjectPropID]
    ON [dbo].[comp_sales_property_grids]([lSubjectPropID] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_lGridID]
    ON [dbo].[comp_sales_property_grids]([lGridID] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Should Print Comments be printed for Comp Sales Grid', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_property_grids', @level2type = N'COLUMN', @level2name = N'bPrintComments';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Printable Comments for Comp Sales Grid', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_property_grids', @level2type = N'COLUMN', @level2name = N'szPrintComments';


GO

