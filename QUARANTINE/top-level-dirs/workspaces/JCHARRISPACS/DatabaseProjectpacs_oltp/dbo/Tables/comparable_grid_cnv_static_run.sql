CREATE TABLE [dbo].[comparable_grid_cnv_static_run] (
    [lCnvStaticRunID]    INT            IDENTITY (1, 1) NOT NULL,
    [dtRun]              DATETIME       NOT NULL,
    [szQuery]            VARCHAR (2048) NOT NULL,
    [bMakeStaticDefault] BIT            NOT NULL,
    [bReplaceExisting]   BIT            NOT NULL,
    [lPacsUserID]        INT            NOT NULL,
    CONSTRAINT [CPK_comparable_grid_cnv_static_run] PRIMARY KEY CLUSTERED ([lCnvStaticRunID] ASC) WITH (FILLFACTOR = 100)
);


GO

