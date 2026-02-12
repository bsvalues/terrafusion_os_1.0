CREATE TABLE [dbo].[delq_roll_params_entity] (
    [pacs_user_id] INT NOT NULL,
    [entity_id]    INT NOT NULL,
    CONSTRAINT [CPK_delq_roll_params_entity] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

