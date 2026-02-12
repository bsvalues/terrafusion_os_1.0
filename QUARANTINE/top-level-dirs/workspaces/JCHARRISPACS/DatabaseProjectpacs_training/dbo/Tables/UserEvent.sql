CREATE TABLE [dbo].[UserEvent] (
    [UserEventId]                BIGINT         IDENTITY (1, 1) NOT NULL,
    [WorkflowInstanceInternalId] BIGINT         NOT NULL,
    [EventOrder]                 INT            NOT NULL,
    [ActivityInstanceId]         BIGINT         NOT NULL,
    [EventDateTime]              DATETIME       NOT NULL,
    [UserDataKey]                NVARCHAR (512) NULL,
    [UserDataTypeId]             INT            NULL,
    [UserData_Str]               NVARCHAR (512) NULL,
    [UserData_Blob]              IMAGE          NULL,
    [UserDataNonSerializable]    BIT            NOT NULL,
    [DbEventDateTime]            DATETIME       DEFAULT (getutcdate()) NOT NULL
);


GO

CREATE CLUSTERED INDEX [idx_WorkflowInstanceInternalId]
    ON [dbo].[UserEvent]([WorkflowInstanceInternalId] ASC);


GO

