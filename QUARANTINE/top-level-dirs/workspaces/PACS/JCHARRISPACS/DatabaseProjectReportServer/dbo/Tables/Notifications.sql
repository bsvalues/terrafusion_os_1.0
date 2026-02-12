CREATE TABLE [dbo].[Notifications] (
    [NotificationID]          UNIQUEIDENTIFIER NOT NULL,
    [SubscriptionID]          UNIQUEIDENTIFIER NOT NULL,
    [ActivationID]            UNIQUEIDENTIFIER NULL,
    [ReportID]                UNIQUEIDENTIFIER NOT NULL,
    [SnapShotDate]            DATETIME         NULL,
    [ExtensionSettings]       NTEXT            NOT NULL,
    [Locale]                  NVARCHAR (128)   NOT NULL,
    [Parameters]              NTEXT            NULL,
    [ProcessStart]            DATETIME         NULL,
    [NotificationEntered]     DATETIME         NOT NULL,
    [ProcessAfter]            DATETIME         NULL,
    [Attempt]                 INT              NULL,
    [SubscriptionLastRunTime] DATETIME         NOT NULL,
    [DeliveryExtension]       NVARCHAR (260)   NOT NULL,
    [SubscriptionOwnerID]     UNIQUEIDENTIFIER NOT NULL,
    [IsDataDriven]            BIT              NOT NULL,
    [BatchID]                 UNIQUEIDENTIFIER NULL,
    [ProcessHeartbeat]        DATETIME         NULL,
    [Version]                 INT              NOT NULL,
    [ReportZone]              INT              DEFAULT ((0)) NOT NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED ([NotificationID] ASC),
    CONSTRAINT [FK_Notifications_Subscriptions] FOREIGN KEY ([SubscriptionID]) REFERENCES [dbo].[Subscriptions] ([SubscriptionID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_Notifications3]
    ON [dbo].[Notifications]([NotificationEntered] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Notifications2]
    ON [dbo].[Notifications]([ProcessStart] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Notifications]
    ON [dbo].[Notifications]([ProcessAfter] ASC);


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Notifications] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Notifications] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Notifications] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[Notifications] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[Notifications] TO [RSExecRole]
    AS [dbo];


GO

