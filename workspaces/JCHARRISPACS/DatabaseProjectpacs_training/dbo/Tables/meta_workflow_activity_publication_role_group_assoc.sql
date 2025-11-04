CREATE TABLE [dbo].[meta_workflow_activity_publication_role_group_assoc] (
    [activity_publication_id] INT NOT NULL,
    [role_group_id]           INT NOT NULL,
    CONSTRAINT [CPK_meta_workflow_activity_publication_role_group_assoc] PRIMARY KEY CLUSTERED ([activity_publication_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_meta_workflow_activity_publication_role_group_assoc_activity_publication_id] FOREIGN KEY ([activity_publication_id]) REFERENCES [dbo].[meta_workflow_activity_publication] ([publication_id]),
    CONSTRAINT [CFK_meta_workflow_activity_publication_role_group_assoc_role_group_id] FOREIGN KEY ([role_group_id]) REFERENCES [dbo].[meta_workflow_role_group] ([role_group_id])
);


GO

