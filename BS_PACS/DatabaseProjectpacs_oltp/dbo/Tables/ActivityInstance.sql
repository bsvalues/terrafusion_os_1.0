CREATE TABLE [dbo].[ActivityInstance] (
    [WorkflowInstanceInternalId] BIGINT           NOT NULL,
    [ActivityInstanceId]         BIGINT           IDENTITY (1, 1) NOT NULL,
    [QualifiedName]              NVARCHAR (128)   NOT NULL,
    [ContextGuid]                UNIQUEIDENTIFIER NOT NULL,
    [ParentContextGuid]          UNIQUEIDENTIFIER NULL,
    [WorkflowInstanceEventId]    BIGINT           NULL,
    CONSTRAINT [CPK_ActivityInstance] PRIMARY KEY NONCLUSTERED ([ActivityInstanceId] ASC)
);


GO

CREATE CLUSTERED INDEX [idx_WorkflowInstanceInternalId]
    ON [dbo].[ActivityInstance]([WorkflowInstanceInternalId] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_WorkflowInstanceInternalId_QualifiedName_ContextGuid_ParentContextGuid]
    ON [dbo].[ActivityInstance]([WorkflowInstanceInternalId] ASC, [QualifiedName] ASC, [ContextGuid] ASC, [ParentContextGuid] ASC);


GO

