CREATE TABLE [dbo].[user_input_query] (
    [query_id]  INT      IDENTITY (1, 1) NOT NULL,
    [create_dt] DATETIME NOT NULL,
    CONSTRAINT [CPK_user_input_query] PRIMARY KEY CLUSTERED ([query_id] ASC) WITH (FILLFACTOR = 100)
);

