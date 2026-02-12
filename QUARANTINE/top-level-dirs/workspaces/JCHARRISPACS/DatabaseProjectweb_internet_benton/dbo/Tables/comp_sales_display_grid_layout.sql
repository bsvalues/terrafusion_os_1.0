CREATE TABLE [dbo].[comp_sales_display_grid_layout] (
    [lGridLayoutID] INT          IDENTITY (100000000, 1) NOT NULL,
    [lGridID]       INT          NOT NULL,
    [lFieldID]      INT          NOT NULL,
    [szCustomText]  VARCHAR (50) NULL,
    CONSTRAINT [CPK_comp_sales_display_grid_layout] PRIMARY KEY CLUSTERED ([lGridLayoutID] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_lGridID]
    ON [dbo].[comp_sales_display_grid_layout]([lGridID] ASC) WITH (FILLFACTOR = 90);


GO

