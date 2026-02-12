CREATE TABLE [dbo].[WorkflowInstanceEvent] (
    [WorkflowInstanceEventId]    BIGINT   IDENTITY (1, 1) NOT NULL,
    [WorkflowInstanceInternalId] BIGINT   NOT NULL,
    [TrackingWorkflowEventId]    TINYINT  NOT NULL,
    [EventDateTime]              DATETIME NOT NULL,
    [EventOrder]                 INT      NOT NULL,
    [EventArgTypeId]             INT      NULL,
    [EventArg]                   IMAGE    NULL,
    [DbEventDateTime]            DATETIME DEFAULT (getutcdate()) NOT NULL,
    CONSTRAINT [CPK_WorkflowInstanceEvent] PRIMARY KEY CLUSTERED ([WorkflowInstanceEventId] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_WorkflowInstanceInternalId]
    ON [dbo].[WorkflowInstanceEvent]([WorkflowInstanceInternalId] ASC);


GO

