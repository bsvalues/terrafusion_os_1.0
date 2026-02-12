CREATE TABLE [dbo].[SubscriptionHistory] (
    [SubscriptionHistoryID] BIGINT           IDENTITY (1, 1) NOT NULL,
    [SubscriptionID]        UNIQUEIDENTIFIER NOT NULL,
    [Type]                  TINYINT          NULL,
    [StartTime]             DATETIME         NULL,
    [EndTime]               DATETIME         NULL,
    [Status]                TINYINT          NULL,
    [Message]               NVARCHAR (1500)  NULL,
    [Details]               NVARCHAR (4000)  NULL,
    CONSTRAINT [PK_SubscriptionHistory] PRIMARY KEY CLUSTERED ([SubscriptionHistoryID] ASC),
    CONSTRAINT [FK_SubscriptionHistory_Subscriptions] FOREIGN KEY ([SubscriptionID]) REFERENCES [dbo].[Subscriptions] ([SubscriptionID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_SubscriptionHistorySubscriptionID]
    ON [dbo].[SubscriptionHistory]([SubscriptionID] ASC);


GO

GRANT UPDATE
    ON OBJECT::[dbo].[SubscriptionHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[SubscriptionHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[SubscriptionHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[SubscriptionHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[SubscriptionHistory] TO [RSExecRole]
    AS [dbo];


GO

