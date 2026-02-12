CREATE TABLE [dbo].[comp_sales_display_grid] (
    [lGridID]          INT           IDENTITY (100000000, 1) NOT NULL,
    [lPacsUserID]      INT           NOT NULL,
    [szGridName]       VARCHAR (255) NULL,
    [cDefault]         CHAR (1)      NOT NULL,
    [cResidentialGrid] CHAR (1)      NOT NULL,
    [szGridType]       VARCHAR (5)   NULL,
    CONSTRAINT [CPK_comp_sales_display_grid] PRIMARY KEY CLUSTERED ([lGridID] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_lPacsUserID_cDefault]
    ON [dbo].[comp_sales_display_grid]([lPacsUserID] ASC, [cDefault] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_lPacsUserID_szGridName]
    ON [dbo].[comp_sales_display_grid]([lPacsUserID] ASC, [szGridName] ASC) WITH (FILLFACTOR = 90);


GO

