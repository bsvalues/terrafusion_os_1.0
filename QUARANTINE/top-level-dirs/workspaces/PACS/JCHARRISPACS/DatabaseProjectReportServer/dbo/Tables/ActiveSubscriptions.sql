CREATE TABLE [dbo].[ActiveSubscriptions] (
    [ActiveID]           UNIQUEIDENTIFIER NOT NULL,
    [SubscriptionID]     UNIQUEIDENTIFIER NOT NULL,
    [TotalNotifications] INT              NULL,
    [TotalSuccesses]     INT              NOT NULL,
    [TotalFailures]      INT              NOT NULL,
    CONSTRAINT [PK_ActiveSubscriptions] PRIMARY KEY CLUSTERED ([ActiveID] ASC),
    CONSTRAINT [FK_ActiveSubscriptions_Subscriptions] FOREIGN KEY ([SubscriptionID]) REFERENCES [dbo].[Subscriptions] ([SubscriptionID]) ON DELETE CASCADE
);


GO

GRANT DELETE
    ON OBJECT::[dbo].[ActiveSubscriptions] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[ActiveSubscriptions] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[ActiveSubscriptions] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[ActiveSubscriptions] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[ActiveSubscriptions] TO [RSExecRole]
    AS [dbo];


GO

