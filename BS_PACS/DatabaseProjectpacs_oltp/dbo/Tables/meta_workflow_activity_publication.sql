CREATE TABLE [dbo].[meta_workflow_activity_publication] (
    [publication_id]              INT              IDENTITY (1, 1) NOT NULL,
    [workflow_publication_id]     INT              NOT NULL,
    [activity_type_id]            INT              NOT NULL,
    [activity_designcontext_guid] UNIQUEIDENTIFIER NOT NULL,
    [activity_description]        NVARCHAR (255)   NULL,
    CONSTRAINT [CPK_meta_workflow_activity_publication] PRIMARY KEY CLUSTERED ([publication_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_meta_workflow_activity_publication_activity_type_id] FOREIGN KEY ([activity_type_id]) REFERENCES [dbo].[meta_workflow_object_type] ([object_type_id]),
    CONSTRAINT [CFK_meta_workflow_activity_publication_workflow_publication_id] FOREIGN KEY ([workflow_publication_id]) REFERENCES [dbo].[meta_workflow_publication] ([publication_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_activity_designcontext_guid]
    ON [dbo].[meta_workflow_activity_publication]([activity_designcontext_guid] ASC);


GO

