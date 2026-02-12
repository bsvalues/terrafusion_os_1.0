CREATE TABLE [dbo].[TrackingDataItemAnnotation] (
    [TrackingDataItemId]         BIGINT          NOT NULL,
    [WorkflowInstanceInternalId] BIGINT          NOT NULL,
    [Annotation]                 NVARCHAR (1024) NOT NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_WorkflowInstanceInternalId]
    ON [dbo].[TrackingDataItemAnnotation]([WorkflowInstanceInternalId] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_TrackingDataItemId]
    ON [dbo].[TrackingDataItemAnnotation]([TrackingDataItemId] ASC);


GO

