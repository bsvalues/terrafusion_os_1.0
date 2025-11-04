CREATE TABLE [dbo].[Activity] (
    [WorkflowTypeId]      INT            NOT NULL,
    [QualifiedName]       NVARCHAR (128) NOT NULL,
    [ActivityTypeId]      INT            NOT NULL,
    [ParentQualifiedName] NVARCHAR (128) NULL,
    CONSTRAINT [CPK_Activity] PRIMARY KEY CLUSTERED ([WorkflowTypeId] ASC, [QualifiedName] ASC),
    CONSTRAINT [CFK_Activity_WorkflowTypeId] FOREIGN KEY ([WorkflowTypeId]) REFERENCES [dbo].[Workflow] ([WorkflowTypeId])
);


GO

CREATE NONCLUSTERED INDEX [idx_WorkflowTypeId]
    ON [dbo].[Activity]([WorkflowTypeId] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_QualifiedName]
    ON [dbo].[Activity]([QualifiedName] ASC);


GO

