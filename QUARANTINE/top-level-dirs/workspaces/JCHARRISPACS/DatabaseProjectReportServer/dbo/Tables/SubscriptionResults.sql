CREATE TABLE [dbo].[SubscriptionResults] (
    [SubscriptionResultID]  UNIQUEIDENTIFIER NOT NULL,
    [SubscriptionID]        UNIQUEIDENTIFIER NOT NULL,
    [ExtensionSettingsHash] INT              NOT NULL,
    [ExtensionSettings]     NVARCHAR (MAX)   NOT NULL,
    [SubscriptionResult]    NVARCHAR (260)   NULL,
    CONSTRAINT [PK_SubscriptionResults] PRIMARY KEY CLUSTERED ([SubscriptionResultID] ASC),
    CONSTRAINT [FK_SubscriptionResults_Subscriptions] FOREIGN KEY ([SubscriptionID]) REFERENCES [dbo].[Subscriptions] ([SubscriptionID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_SubscriptionResults]
    ON [dbo].[SubscriptionResults]([SubscriptionID] ASC, [ExtensionSettingsHash] ASC);


GO

GRANT INSERT
    ON OBJECT::[dbo].[SubscriptionResults] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[SubscriptionResults] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[SubscriptionResults] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[SubscriptionResults] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[SubscriptionResults] TO [RSExecRole]
    AS [dbo];


GO

