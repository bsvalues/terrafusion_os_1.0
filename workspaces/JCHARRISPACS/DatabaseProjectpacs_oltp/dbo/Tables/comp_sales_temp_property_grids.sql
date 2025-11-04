CREATE TABLE [dbo].[comp_sales_temp_property_grids] (
    [lTempPropGridID]  INT           IDENTITY (100000000, 1) NOT NULL,
    [lSubjectPropID]   INT           NOT NULL,
    [szGridName]       VARCHAR (64)  NULL,
    [lGridID]          INT           NOT NULL,
    [lColWidthFields]  INT           NOT NULL,
    [lColWidthSubject] INT           NOT NULL,
    [lPrecision]       INT           NOT NULL,
    [dtCreated]        DATETIME      NOT NULL,
    [lPacsUserID]      INT           NOT NULL,
    [lYear]            NUMERIC (4)   NOT NULL,
    [szComments]       VARCHAR (500) NULL,
    [comparison_type]  CHAR (1)      NULL,
    [cShowDate]        CHAR (1)      NULL,
    [dtMarket]         DATETIME      NOT NULL,
    [bPrintComments]   BIT           CONSTRAINT [CDF_comp_sales_temp_property_grids_bPrintComments] DEFAULT ((0)) NOT NULL,
    [szPrintComments]  VARCHAR (500) NULL,
    CONSTRAINT [CPK_comp_sales_temp_property_grids] PRIMARY KEY CLUSTERED ([lTempPropGridID] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Printable Comments for Temp Comp Sales Grid', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_temp_property_grids', @level2type = N'COLUMN', @level2name = N'szPrintComments';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Should Print Comments be printed for Comp Sales Grid', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_temp_property_grids', @level2type = N'COLUMN', @level2name = N'bPrintComments';


GO

