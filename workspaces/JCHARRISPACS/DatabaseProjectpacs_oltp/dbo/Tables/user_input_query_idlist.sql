CREATE TABLE [dbo].[user_input_query_idlist] (
    [query_id] INT NOT NULL,
    [id]       INT NOT NULL,
    CONSTRAINT [CPK_user_input_query_idlist] PRIMARY KEY CLUSTERED ([query_id] ASC, [id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_user_input_query_idlist_query_id] FOREIGN KEY ([query_id]) REFERENCES [dbo].[user_input_query] ([query_id]) ON DELETE CASCADE
);


GO

GRANT INSERT
    ON OBJECT::[dbo].[user_input_query_idlist] TO [pacsnonprivy]
    AS [dbo];


GO

