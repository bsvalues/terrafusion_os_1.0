CREATE TABLE [dbo].[EventAnnotation] (
    [WorkflowInstanceInternalId] BIGINT          NOT NULL,
    [EventId]                    BIGINT          NOT NULL,
    [EventTypeId]                CHAR (1)        NOT NULL,
    [Annotation]                 NVARCHAR (1024) NULL
);


GO

CREATE CLUSTERED INDEX [idx_WorkflowInstanceInternalId]
    ON [dbo].[EventAnnotation]([WorkflowInstanceInternalId] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_EventId_EventTypeId]
    ON [dbo].[EventAnnotation]([EventId] ASC, [EventTypeId] ASC);


GO

