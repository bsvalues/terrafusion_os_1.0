CREATE TABLE [dbo].[meta_workflow_role_group_user_role_assoc] (
    [role_group_id] INT NOT NULL,
    [role_id]       INT NOT NULL,
    CONSTRAINT [CPK_meta_workflow_role_group_user_role_assoc] PRIMARY KEY CLUSTERED ([role_group_id] ASC, [role_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_meta_workflow_role_group_user_role_assoc_role_group_id] FOREIGN KEY ([role_group_id]) REFERENCES [dbo].[meta_workflow_role_group] ([role_group_id]),
    CONSTRAINT [CFK_meta_workflow_role_group_user_role_assoc_role_id] FOREIGN KEY ([role_id]) REFERENCES [dbo].[user_role] ([role_id])
);


GO

