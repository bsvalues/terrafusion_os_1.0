CREATE TABLE [dbo].[query_builder_query_usersql] (
    [lQueryID] INT            NOT NULL,
    [szSQL]    VARCHAR (8000) NOT NULL,
    CONSTRAINT [CPK_query_builder_query_usersql] PRIMARY KEY CLUSTERED ([lQueryID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_query_builder_query_usersql_lQueryID] FOREIGN KEY ([lQueryID]) REFERENCES [dbo].[query_builder_query] ([lQueryID]) ON DELETE CASCADE
);


GO

