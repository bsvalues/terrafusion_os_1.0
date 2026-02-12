CREATE TABLE [dbo].[Users] (
    [UserID]       UNIQUEIDENTIFIER NOT NULL,
    [Sid]          VARBINARY (85)   NULL,
    [UserType]     INT              NOT NULL,
    [AuthType]     INT              NOT NULL,
    [UserName]     NVARCHAR (260)   NULL,
    [Setting]      NTEXT            NULL,
    [ServiceToken] NTEXT            NULL,
    [ModifiedDate] DATETIME         NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY NONCLUSTERED ([UserID] ASC)
);


GO

CREATE UNIQUE CLUSTERED INDEX [IX_Users]
    ON [dbo].[Users]([Sid] ASC, [UserName] ASC, [AuthType] ASC);


GO

GRANT DELETE
    ON OBJECT::[dbo].[Users] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Users] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Users] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[Users] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Users] TO [RSExecRole]
    AS [dbo];


GO

