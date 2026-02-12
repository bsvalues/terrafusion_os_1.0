CREATE TABLE [dbo].[Subscriptions] (
    [SubscriptionID]    UNIQUEIDENTIFIER NOT NULL,
    [OwnerID]           UNIQUEIDENTIFIER NOT NULL,
    [Report_OID]        UNIQUEIDENTIFIER NOT NULL,
    [Locale]            NVARCHAR (128)   NOT NULL,
    [InactiveFlags]     INT              NOT NULL,
    [ExtensionSettings] NTEXT            NULL,
    [ModifiedByID]      UNIQUEIDENTIFIER NOT NULL,
    [ModifiedDate]      DATETIME         NOT NULL,
    [Description]       NVARCHAR (512)   NULL,
    [LastStatus]        NVARCHAR (260)   NULL,
    [EventType]         NVARCHAR (260)   NOT NULL,
    [MatchData]         NTEXT            NULL,
    [LastRunTime]       DATETIME         NULL,
    [Parameters]        NTEXT            NULL,
    [DataSettings]      NTEXT            NULL,
    [DeliveryExtension] NVARCHAR (260)   NULL,
    [Version]           INT              NOT NULL,
    [ReportZone]        INT              DEFAULT ((0)) NOT NULL,
    CONSTRAINT [PK_Subscriptions] PRIMARY KEY CLUSTERED ([SubscriptionID] ASC),
    CONSTRAINT [FK_Subscriptions_Catalog] FOREIGN KEY ([Report_OID]) REFERENCES [dbo].[Catalog] ([ItemID]) ON DELETE CASCADE NOT FOR REPLICATION,
    CONSTRAINT [FK_Subscriptions_ModifiedBy] FOREIGN KEY ([ModifiedByID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [FK_Subscriptions_Owner] FOREIGN KEY ([OwnerID]) REFERENCES [dbo].[Users] ([UserID])
);


GO


-- end session tables

CREATE TRIGGER [dbo].[Subscription_delete_DataSource] ON [dbo].[Subscriptions]
AFTER DELETE 
AS
    delete DataSource from DataSource DS inner join deleted D on DS.SubscriptionID = D.SubscriptionID

GO


CREATE TRIGGER [dbo].[Subscription_delete_Schedule] ON [dbo].[Subscriptions] 
AFTER DELETE 
AS
    delete ReportSchedule from ReportSchedule RS inner join deleted D on RS.SubscriptionID = D.SubscriptionID

GO

GRANT INSERT
    ON OBJECT::[dbo].[Subscriptions] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Subscriptions] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[Subscriptions] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Subscriptions] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Subscriptions] TO [RSExecRole]
    AS [dbo];


GO

