CREATE TABLE [dbo].[Roles] (
    [RoleID]      UNIQUEIDENTIFIER NOT NULL,
    [RoleName]    NVARCHAR (260)   NOT NULL,
    [Description] NVARCHAR (512)   NULL,
    [TaskMask]    NVARCHAR (32)    NOT NULL,
    [RoleFlags]   TINYINT          NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY NONCLUSTERED ([RoleID] ASC)
);


GO

CREATE UNIQUE CLUSTERED INDEX [IX_Roles]
    ON [dbo].[Roles]([RoleName] ASC);


GO

GRANT DELETE
    ON OBJECT::[dbo].[Roles] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[Roles] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Roles] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Roles] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Roles] TO [RSExecRole]
    AS [dbo];


GO

