CREATE TABLE [dbo].[supp_roll_prop_list] (
    [pacs_user_id] INT NOT NULL,
    [sup_group_id] INT NOT NULL,
    [prop_id]      INT NOT NULL,
    CONSTRAINT [CPK_supp_roll_prop_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [sup_group_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 100)
);


GO

