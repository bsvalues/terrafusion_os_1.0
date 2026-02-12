CREATE TABLE [dbo].[penpad_delete_log_keys] (
    [lDeleteID]     INT           NOT NULL,
    [szColumnName]  [sysname]     NOT NULL,
    [szColumnValue] VARCHAR (512) NOT NULL,
    CONSTRAINT [CPK_penpad_delete_log_keys] PRIMARY KEY CLUSTERED ([lDeleteID] ASC, [szColumnName] ASC) WITH (FILLFACTOR = 90)
);


GO

