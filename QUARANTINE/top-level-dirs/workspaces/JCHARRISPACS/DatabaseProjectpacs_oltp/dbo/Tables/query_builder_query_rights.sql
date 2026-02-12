CREATE TABLE [dbo].[query_builder_query_rights] (
    [lQueryID]    INT NOT NULL,
    [lPacsUserID] INT NOT NULL,
    CONSTRAINT [CPK_query_builder_query_rights] PRIMARY KEY CLUSTERED ([lQueryID] ASC, [lPacsUserID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_query_builder_query_rights_lQueryID] FOREIGN KEY ([lQueryID]) REFERENCES [dbo].[query_builder_query] ([lQueryID]) ON DELETE CASCADE
);


GO

