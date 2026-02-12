CREATE TABLE [dbo].[chg_log_trans_selection] (
    [lChangeLogTransSelectID] INT          IDENTITY (1, 1) NOT NULL,
    [lPacsUserID]             INT          NOT NULL,
    [szTransSelectName]       VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_chg_log_trans_selection] PRIMARY KEY CLUSTERED ([lChangeLogTransSelectID] ASC) WITH (FILLFACTOR = 100)
);


GO

