CREATE TABLE [dbo].[WorkflowInstance] (
    [WorkflowInstanceInternalId] BIGINT           IDENTITY (1, 1) NOT NULL,
    [WorkflowInstanceId]         UNIQUEIDENTIFIER NOT NULL,
    [ContextGuid]                UNIQUEIDENTIFIER NOT NULL,
    [CallerInstanceId]           UNIQUEIDENTIFIER NULL,
    [CallPath]                   NVARCHAR (400)   NULL,
    [CallerContextGuid]          UNIQUEIDENTIFIER NULL,
    [CallerParentContextGuid]    UNIQUEIDENTIFIER NULL,
    [WorkflowTypeId]             INT              NOT NULL,
    [InitializedDateTime]        DATETIME         NOT NULL,
    [DbInitializedDateTime]      DATETIME         DEFAULT (getutcdate()) NOT NULL,
    [EndDateTime]                DATETIME         NULL,
    [DbEndDateTime]              DATETIME         NULL,
    CONSTRAINT [CPK_WorkflowInstance] PRIMARY KEY CLUSTERED ([WorkflowInstanceInternalId] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_WorkflowInstanceId_ContextGuid]
    ON [dbo].[WorkflowInstance]([WorkflowInstanceId] ASC, [ContextGuid] ASC);


GO

