CREATE TABLE [dbo].[meta_workflow_role_group] (
    [role_group_id] INT            IDENTITY (1, 1) NOT NULL,
    [description]   NVARCHAR (255) NULL,
    CONSTRAINT [CPK_meta_workflow_role_group] PRIMARY KEY CLUSTERED ([role_group_id] ASC) WITH (FILLFACTOR = 100)
);


GO

