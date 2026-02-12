CREATE TABLE [dbo].[user_input_query_idlist] (
    [query_id] INT NOT NULL,
    [id]       INT NOT NULL,
    CONSTRAINT [CPK_user_input_query_idlist] PRIMARY KEY CLUSTERED ([query_id] ASC, [id] ASC) WITH (FILLFACTOR = 100)
);

