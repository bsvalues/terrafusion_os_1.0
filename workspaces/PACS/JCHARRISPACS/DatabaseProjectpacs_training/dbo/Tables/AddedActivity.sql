CREATE TABLE [dbo].[AddedActivity] (
    [WorkflowInstanceInternalId] BIGINT          NOT NULL,
    [WorkflowInstanceEventId]    BIGINT          NOT NULL,
    [QualifiedName]              NVARCHAR (128)  NOT NULL,
    [ActivityTypeId]             INT             NOT NULL,
    [ParentQualifiedName]        NVARCHAR (128)  NULL,
    [AddedActivityAction]        NVARCHAR (2000) NULL,
    [Order]                      INT             NULL
);


GO

CREATE CLUSTERED INDEX [idx_WorkflowInstanceInternalId]
    ON [dbo].[AddedActivity]([WorkflowInstanceInternalId] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_WorkflowInstanceEventId]
    ON [dbo].[AddedActivity]([WorkflowInstanceEventId] ASC);


GO

