CREATE TABLE [dbo].[meta_workflow_publication] (
    [publication_id]       INT            IDENTITY (1, 1) NOT NULL,
    [workflow_type_id]     INT            NOT NULL,
    [workflow_description] NVARCHAR (255) NULL,
    CONSTRAINT [CPK_meta_workflow_publication] PRIMARY KEY CLUSTERED ([publication_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_meta_workflow_publication_workflow_type_id] FOREIGN KEY ([workflow_type_id]) REFERENCES [dbo].[meta_workflow_object_type] ([object_type_id])
);


GO

