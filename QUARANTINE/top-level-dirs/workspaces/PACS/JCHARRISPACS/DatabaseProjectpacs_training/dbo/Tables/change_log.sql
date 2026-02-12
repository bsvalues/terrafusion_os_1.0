CREATE TABLE [dbo].[change_log] (
    [lChangeID]     INT           IDENTITY (1, 1) NOT NULL,
    [lPacsUserID]   INT           NOT NULL,
    [szSQLAccount]  VARCHAR (50)  NOT NULL,
    [szMachineName] VARCHAR (50)  NOT NULL,
    [dtChange]      DATETIME      NOT NULL,
    [szChangeType]  CHAR (1)      NOT NULL,
    [iTableID]      SMALLINT      NOT NULL,
    [iColumnID]     SMALLINT      NOT NULL,
    [szOldValue]    VARCHAR (255) NULL,
    [szNewValue]    VARCHAR (255) NULL,
    [szRefID]       VARCHAR (255) NULL,
    CONSTRAINT [CPK_change_log] PRIMARY KEY CLUSTERED ([lChangeID] ASC) WITH (FILLFACTOR = 90)
);


GO

