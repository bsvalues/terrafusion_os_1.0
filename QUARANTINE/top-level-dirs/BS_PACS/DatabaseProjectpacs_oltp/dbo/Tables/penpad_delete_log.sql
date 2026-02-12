CREATE TABLE [dbo].[penpad_delete_log] (
    [lDeleteID]   INT       IDENTITY (100000, 1) NOT NULL,
    [szTableName] [sysname] NOT NULL,
    CONSTRAINT [CPK_penpad_delete_log] PRIMARY KEY CLUSTERED ([lDeleteID] ASC) WITH (FILLFACTOR = 90)
);


GO

