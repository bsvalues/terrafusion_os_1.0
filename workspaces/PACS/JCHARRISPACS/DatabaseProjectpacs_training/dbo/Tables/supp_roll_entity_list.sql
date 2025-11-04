CREATE TABLE [dbo].[supp_roll_entity_list] (
    [sup_group_id] INT NOT NULL,
    [pacs_user_id] INT NOT NULL,
    [entity_id]    INT NOT NULL,
    CONSTRAINT [CPK_supp_roll_entity_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [sup_group_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

