CREATE TABLE [dbo].[ActivityExecutionStatusEvent] (
    [ActivityExecutionStatusEventId] BIGINT   IDENTITY (1, 1) NOT NULL,
    [WorkflowInstanceInternalId]     BIGINT   NOT NULL,
    [EventOrder]                     INT      NOT NULL,
    [ActivityInstanceId]             BIGINT   NOT NULL,
    [ExecutionStatusId]              TINYINT  NOT NULL,
    [EventDateTime]                  DATETIME NOT NULL,
    [DbEventDateTime]                DATETIME DEFAULT (getutcdate()) NOT NULL
);


GO

CREATE CLUSTERED INDEX [idx_WorkflowInstanceInternalId]
    ON [dbo].[ActivityExecutionStatusEvent]([WorkflowInstanceInternalId] ASC);


GO

