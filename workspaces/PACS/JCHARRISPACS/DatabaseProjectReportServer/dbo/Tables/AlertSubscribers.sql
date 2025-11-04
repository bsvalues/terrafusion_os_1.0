CREATE TABLE [dbo].[AlertSubscribers] (
    [AlertSubscriptionID] BIGINT           IDENTITY (1, 1) NOT NULL,
    [AlertType]           NVARCHAR (50)    NOT NULL,
    [UserID]              UNIQUEIDENTIFIER NOT NULL,
    [ItemID]              UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [FK_AlertSubscribers_Catalog] FOREIGN KEY ([ItemID]) REFERENCES [dbo].[Catalog] ([ItemID]),
    CONSTRAINT [FK_AlertSubscribers_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[AlertSubscribers] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[AlertSubscribers] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[AlertSubscribers] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[AlertSubscribers] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[AlertSubscribers] TO [RSExecRole]
    AS [dbo];


GO

