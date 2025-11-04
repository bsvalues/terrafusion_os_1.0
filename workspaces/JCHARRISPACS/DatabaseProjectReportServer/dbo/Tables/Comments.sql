CREATE TABLE [dbo].[Comments] (
    [CommentID]    BIGINT           IDENTITY (1, 1) NOT NULL,
    [ItemID]       UNIQUEIDENTIFIER NOT NULL,
    [UserID]       UNIQUEIDENTIFIER NOT NULL,
    [ThreadID]     BIGINT           NULL,
    [Text]         NVARCHAR (2048)  NOT NULL,
    [CreatedDate]  DATETIME         NOT NULL,
    [ModifiedDate] DATETIME         NULL,
    [AttachmentID] UNIQUEIDENTIFIER NULL,
    CONSTRAINT [PK_Comments] PRIMARY KEY CLUSTERED ([CommentID] ASC),
    CONSTRAINT [FK_Comments_Catalog] FOREIGN KEY ([ItemID]) REFERENCES [dbo].[Catalog] ([ItemID]) ON DELETE CASCADE,
    CONSTRAINT [FK_Comments_CatalogResource] FOREIGN KEY ([AttachmentID]) REFERENCES [dbo].[Catalog] ([ItemID]),
    CONSTRAINT [FK_Comments_Comments] FOREIGN KEY ([ThreadID]) REFERENCES [dbo].[Comments] ([CommentID]),
    CONSTRAINT [FK_Comments_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_Comments_Thread]
    ON [dbo].[Comments]([ThreadID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Comments_User]
    ON [dbo].[Comments]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Comments_Item]
    ON [dbo].[Comments]([ItemID] ASC);


GO

GRANT DELETE
    ON OBJECT::[dbo].[Comments] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Comments] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Comments] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Comments] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[Comments] TO [RSExecRole]
    AS [dbo];


GO

