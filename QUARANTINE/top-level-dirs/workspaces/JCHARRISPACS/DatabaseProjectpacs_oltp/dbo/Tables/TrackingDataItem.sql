CREATE TABLE [dbo].[TrackingDataItem] (
    [TrackingDataItemId]         BIGINT         IDENTITY (1, 1) NOT NULL,
    [WorkflowInstanceInternalId] BIGINT         NOT NULL,
    [EventId]                    BIGINT         NOT NULL,
    [EventTypeId]                CHAR (1)       NOT NULL,
    [FieldName]                  NVARCHAR (256) NOT NULL,
    [FieldTypeId]                INT            NULL,
    [Data_Str]                   NVARCHAR (512) NULL,
    [Data_Blob]                  IMAGE          NULL,
    [DataNonSerializable]        BIT            NOT NULL,
    CONSTRAINT [CPK_TrackingDataItem] PRIMARY KEY CLUSTERED ([TrackingDataItemId] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_WorkflowInstanceInternalId_EventId_EventTypeId]
    ON [dbo].[TrackingDataItem]([WorkflowInstanceInternalId] ASC, [EventId] ASC, [EventTypeId] ASC);


GO

