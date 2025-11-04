CREATE TABLE [dbo].[ServerUpgradeHistory] (
    [UpgradeID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [ServerVersion] NVARCHAR (25)  NULL,
    [User]          NVARCHAR (128) DEFAULT (suser_sname()) NULL,
    [DateTime]      DATETIME       DEFAULT (getdate()) NULL,
    CONSTRAINT [PK_ServerUpgradeHistory] PRIMARY KEY CLUSTERED ([UpgradeID] DESC)
);


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[ServerUpgradeHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[ServerUpgradeHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[ServerUpgradeHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[ServerUpgradeHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[ServerUpgradeHistory] TO [RSExecRole]
    AS [dbo];


GO

