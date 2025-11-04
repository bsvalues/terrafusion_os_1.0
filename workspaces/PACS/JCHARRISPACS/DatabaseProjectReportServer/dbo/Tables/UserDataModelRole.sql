CREATE TABLE [dbo].[UserDataModelRole] (
    [UserID]          UNIQUEIDENTIFIER NOT NULL,
    [DataModelRoleID] BIGINT           NOT NULL,
    CONSTRAINT [PK_UserDataModelRole] PRIMARY KEY CLUSTERED ([UserID] ASC, [DataModelRoleID] ASC),
    CONSTRAINT [FK_UserDataModelRole_DataModelRole] FOREIGN KEY ([DataModelRoleID]) REFERENCES [dbo].[DataModelRole] ([DataModelRoleID]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserDataModelRole_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]) ON DELETE CASCADE
);


GO

GRANT DELETE
    ON OBJECT::[dbo].[UserDataModelRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[UserDataModelRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[UserDataModelRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[UserDataModelRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[UserDataModelRole] TO [RSExecRole]
    AS [dbo];


GO

