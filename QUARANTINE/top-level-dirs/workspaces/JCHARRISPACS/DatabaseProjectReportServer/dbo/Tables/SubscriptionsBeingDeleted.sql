CREATE TABLE [dbo].[SubscriptionsBeingDeleted] (
    [SubscriptionID] UNIQUEIDENTIFIER NOT NULL,
    [CreationDate]   DATETIME         NOT NULL,
    CONSTRAINT [PK_SubscriptionsBeingDeleted] PRIMARY KEY CLUSTERED ([SubscriptionID] ASC)
);


GO

GRANT INSERT
    ON OBJECT::[dbo].[SubscriptionsBeingDeleted] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[SubscriptionsBeingDeleted] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[SubscriptionsBeingDeleted] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[SubscriptionsBeingDeleted] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[SubscriptionsBeingDeleted] TO [RSExecRole]
    AS [dbo];


GO

