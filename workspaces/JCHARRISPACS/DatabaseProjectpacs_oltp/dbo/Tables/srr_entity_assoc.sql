CREATE TABLE [dbo].[srr_entity_assoc] (
    [option_id]    INT NOT NULL,
    [pacs_user_id] INT NOT NULL,
    [sup_group_id] INT NOT NULL,
    [entity_id]    INT NOT NULL,
    CONSTRAINT [CPK_srr_entity_assoc] PRIMARY KEY CLUSTERED ([option_id] ASC, [pacs_user_id] ASC, [sup_group_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 90)
);


GO

