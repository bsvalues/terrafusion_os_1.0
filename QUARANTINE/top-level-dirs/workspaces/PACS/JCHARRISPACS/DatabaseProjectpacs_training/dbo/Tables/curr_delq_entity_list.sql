CREATE TABLE [dbo].[curr_delq_entity_list] (
    [pacs_user_id] INT NOT NULL,
    [entity_id]    INT NOT NULL,
    CONSTRAINT [CPK_curr_delq_entity_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

