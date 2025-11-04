CREATE TABLE [dbo].[Favorites] (
    [ItemID] UNIQUEIDENTIFIER NOT NULL,
    [UserID] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [PK_Favorites] PRIMARY KEY NONCLUSTERED ([ItemID] ASC, [UserID] ASC),
    CONSTRAINT [FK_Favorites_Catalog] FOREIGN KEY ([ItemID]) REFERENCES [dbo].[Catalog] ([ItemID]),
    CONSTRAINT [FK_Favorites_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE CLUSTERED INDEX [IX_Favorites_UserID]
    ON [dbo].[Favorites]([UserID] ASC);


GO

GRANT SELECT
    ON OBJECT::[dbo].[Favorites] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[Favorites] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Favorites] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[Favorites] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Favorites] TO [RSExecRole]
    AS [dbo];


GO

