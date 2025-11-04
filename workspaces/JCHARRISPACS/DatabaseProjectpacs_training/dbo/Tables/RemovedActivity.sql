CREATE TABLE [dbo].[RemovedActivity] (
    [WorkflowInstanceInternalId] BIGINT          NOT NULL,
    [WorkflowInstanceEventId]    BIGINT          NOT NULL,
    [QualifiedName]              NVARCHAR (128)  NOT NULL,
    [ParentQualifiedName]        NVARCHAR (128)  NULL,
    [RemovedActivityAction]      NVARCHAR (2000) NULL,
    [Order]                      INT             NULL
);


GO

CREATE CLUSTERED INDEX [idx_WorkflowInstanceInternalId]
    ON [dbo].[RemovedActivity]([WorkflowInstanceInternalId] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_WorkflowInstanceEventId]
    ON [dbo].[RemovedActivity]([WorkflowInstanceEventId] ASC);


GO

