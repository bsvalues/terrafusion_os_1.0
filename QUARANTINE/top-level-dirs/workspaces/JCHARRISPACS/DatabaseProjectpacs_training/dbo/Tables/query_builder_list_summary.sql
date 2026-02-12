CREATE TABLE [dbo].[query_builder_list_summary] (
    [lListID]      INT      IDENTITY (100000, 1) NOT NULL,
    [lElementType] INT      NOT NULL,
    [lPacsUserID]  INT      NOT NULL,
    [dtCreate]     DATETIME NOT NULL,
    [dtExpire]     DATETIME NULL,
    CONSTRAINT [CPK_query_builder_list_summary] PRIMARY KEY CLUSTERED ([lListID] ASC) WITH (FILLFACTOR = 100)
);


GO

