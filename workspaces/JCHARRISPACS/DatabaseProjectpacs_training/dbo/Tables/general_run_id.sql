CREATE TABLE [dbo].[general_run_id] (
    [lGeneralRunID]  INT          IDENTITY (1, 1) NOT NULL,
    [szProcessName]  VARCHAR (23) NOT NULL,
    [dtRun]          DATETIME     NOT NULL,
    [lPacsUserID]    INT          NOT NULL,
    [dtProcessBegin] DATETIME     NULL,
    [dtProcessEnd]   DATETIME     NULL,
    CONSTRAINT [CPK_general_run_id] PRIMARY KEY CLUSTERED ([lGeneralRunID] ASC) WITH (FILLFACTOR = 100)
);


GO

