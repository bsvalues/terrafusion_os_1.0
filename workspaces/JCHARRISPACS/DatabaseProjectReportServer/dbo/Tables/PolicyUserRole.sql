CREATE TABLE [dbo].[PolicyUserRole] (
    [ID]       UNIQUEIDENTIFIER NOT NULL,
    [RoleID]   UNIQUEIDENTIFIER NOT NULL,
    [UserID]   UNIQUEIDENTIFIER NOT NULL,
    [PolicyID] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [PK_PolicyUserRole] PRIMARY KEY NONCLUSTERED ([ID] ASC),
    CONSTRAINT [FK_PolicyUserRole_Policy] FOREIGN KEY ([PolicyID]) REFERENCES [dbo].[Policies] ([PolicyID]) ON DELETE CASCADE,
    CONSTRAINT [FK_PolicyUserRole_Role] FOREIGN KEY ([RoleID]) REFERENCES [dbo].[Roles] ([RoleID]),
    CONSTRAINT [FK_PolicyUserRole_User] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE UNIQUE CLUSTERED INDEX [IX_PolicyUserRole]
    ON [dbo].[PolicyUserRole]([RoleID] ASC, [UserID] ASC, [PolicyID] ASC);


GO

GRANT UPDATE
    ON OBJECT::[dbo].[PolicyUserRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[PolicyUserRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[PolicyUserRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[PolicyUserRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[PolicyUserRole] TO [RSExecRole]
    AS [dbo];


GO

