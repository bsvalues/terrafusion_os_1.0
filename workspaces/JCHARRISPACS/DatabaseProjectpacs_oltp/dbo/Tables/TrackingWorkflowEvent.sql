CREATE TABLE [dbo].[TrackingWorkflowEvent] (
    [TrackingWorkflowEventId] TINYINT       NOT NULL,
    [Description]             NVARCHAR (32) NOT NULL,
    CONSTRAINT [CPK_TrackingWorkflowEvent] PRIMARY KEY CLUSTERED ([TrackingWorkflowEventId] ASC)
);


GO

